import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { findNodeHandle, Keyboard, Platform, type NativeScrollEvent, type NativeSyntheticEvent, type TextInputProps } from "react-native";

type KeyboardScrollResponder = {
  scrollResponderScrollNativeHandleToKeyboard?: (
    nodeHandle: number,
    additionalOffset: number,
    preventNegativeScrollOffset: boolean,
  ) => void;
};

type KeyboardScrollable = {
  getScrollResponder?: () => KeyboardScrollResponder | null | undefined;
};

/**
 * Keeps a focused native text input above the soft keyboard without storing any
 * form state or affecting web layout. Automatic correction is active only while
 * the keyboard is visible, so a focused Android input cannot lock later drags.
 */
export function useKeyboardSafeFocus<T>(additionalOffset = 88) {
  const scrollRef = useRef<T | null>(null);
  const focusedTargetRef = useRef<number | null>(null);
  const correctionFrameRef = useRef<number | null>(null);
  const keyboardVisibleRef = useRef(false);
  const [keyboardInset, setKeyboardInset] = useState(0);

  const keepFocusedInputVisible = useCallback(() => {
    const target = focusedTargetRef.current;
    if (Platform.OS === "web" || !keyboardVisibleRef.current || target === null) return;
    const responder = (scrollRef.current as unknown as KeyboardScrollable | null)?.getScrollResponder?.();
    if (!responder?.scrollResponderScrollNativeHandleToKeyboard) return;
    if (correctionFrameRef.current !== null) cancelAnimationFrame(correctionFrameRef.current);
    correctionFrameRef.current = requestAnimationFrame(() => {
      correctionFrameRef.current = null;
      if (!keyboardVisibleRef.current) return;
      responder.scrollResponderScrollNativeHandleToKeyboard?.(target, additionalOffset, true);
    });
  }, [additionalOffset]);

  const onInputFocus = useCallback((event: Parameters<NonNullable<TextInputProps["onFocus"]>>[0]) => {
    if (Platform.OS === "web") return;
    const target = findNodeHandle(event.target as never);
    if (target === null) return;
    focusedTargetRef.current = target;
    keepFocusedInputVisible();
  }, [keepFocusedInputVisible]);

  const onInputBlur = useCallback(() => {
    focusedTargetRef.current = null;
  }, []);

  const onScroll = useCallback((_event: NativeSyntheticEvent<NativeScrollEvent>) => {
    // During the keyboard transition, keep the focused field visible. After
    // dismissal this becomes a no-op, allowing normal user scrolling again.
    keepFocusedInputVisible();
  }, [keepFocusedInputVisible]);

  useEffect(() => {
    if (Platform.OS === "web") return;
    const showSubscription = Keyboard.addListener("keyboardDidShow", (event) => {
      keyboardVisibleRef.current = true;
      setKeyboardInset(Math.max(0, event.endCoordinates?.height ?? 0) + additionalOffset);
      keepFocusedInputVisible();
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      keyboardVisibleRef.current = false;
      setKeyboardInset(0);
      if (correctionFrameRef.current !== null) {
        cancelAnimationFrame(correctionFrameRef.current);
        correctionFrameRef.current = null;
      }
    });
    const frameSubscription = Keyboard.addListener("keyboardDidChangeFrame", (event) => {
      if (keyboardVisibleRef.current) {
        setKeyboardInset(Math.max(0, event.endCoordinates?.height ?? 0) + additionalOffset);
        keepFocusedInputVisible();
      }
    });
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
      frameSubscription.remove();
      keyboardVisibleRef.current = false;
      if (correctionFrameRef.current !== null) cancelAnimationFrame(correctionFrameRef.current);
    };
  }, [additionalOffset, keepFocusedInputVisible]);

  const keyboardContentContainerStyle = useMemo(
    () => ({ paddingBottom: keyboardInset }),
    [keyboardInset],
  );

  // The same helper is shared by ScrollView and FlatList screens. Keep the
  // public ref component-agnostic; the native responder is narrowed above.
  return { scrollRef: scrollRef as unknown as RefObject<never>, onInputFocus, onInputBlur, onScroll, keyboardContentContainerStyle };
}
