import { useCallback, useEffect, useRef } from "react";
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
 * form state or affecting web layout. The root resize policy still protects
 * every screen; this helper adds exact field targeting for long entry forms.
 */
export function useKeyboardSafeFocus<T>(additionalOffset = 88) {
  const scrollRef = useRef<T | null>(null);
  const focusedTargetRef = useRef<number | null>(null);
  const correctionFrameRef = useRef<number | null>(null);

  const keepFocusedInputVisible = useCallback(() => {
    const target = focusedTargetRef.current;
    if (Platform.OS === "web" || target === null) return;
    const responder = (scrollRef.current as unknown as KeyboardScrollable | null)?.getScrollResponder?.();
    if (!responder?.scrollResponderScrollNativeHandleToKeyboard) return;
    if (correctionFrameRef.current !== null) cancelAnimationFrame(correctionFrameRef.current);
    correctionFrameRef.current = requestAnimationFrame(() => {
      correctionFrameRef.current = null;
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
    // Native resize removes the keyboard inset, but it does not prevent a user
    // from dragging the focused field behind the keyboard afterwards. Re-run
    // the native visibility calculation while scrolling, without adding any
    // padding, overlay, or persistent animation.
    keepFocusedInputVisible();
  }, [keepFocusedInputVisible]);

  useEffect(() => {
    if (Platform.OS === "web") return;
    const showSubscription = Keyboard.addListener("keyboardDidShow", keepFocusedInputVisible);
    const frameSubscription = Keyboard.addListener("keyboardDidChangeFrame", keepFocusedInputVisible);
    return () => {
      showSubscription.remove();
      frameSubscription.remove();
      if (correctionFrameRef.current !== null) cancelAnimationFrame(correctionFrameRef.current);
    };
  }, [keepFocusedInputVisible]);

  return { scrollRef, onInputFocus, onInputBlur, onScroll };
}
