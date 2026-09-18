import { useCallback, useRef } from "react";
import { findNodeHandle, Platform, type TextInputProps } from "react-native";

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

  const onInputFocus = useCallback((event: Parameters<NonNullable<TextInputProps["onFocus"]>>[0]) => {
    if (Platform.OS === "web") return;
    const target = findNodeHandle(event.target as never);
    if (target === null) return;
    requestAnimationFrame(() => {
      (scrollRef.current as unknown as KeyboardScrollable | null)?.getScrollResponder?.()
        ?.scrollResponderScrollNativeHandleToKeyboard?.(target, additionalOffset, true);
    });
  }, [additionalOffset]);

  return { scrollRef, onInputFocus };
}
