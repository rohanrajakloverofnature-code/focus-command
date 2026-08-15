import { useEffect, useMemo, useState } from "react";

import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";



import { CommandCard, TapFeedback } from "@/components/focus-ui";

import { IconSymbol } from "@/components/ui/icon-symbol";

import { useColors } from "@/hooks/use-colors";

import {
  
  EMOTION_PREDICTION_LIBRARY_COUNT,
  
  EMOTION_PREDICTION_TRACK_COUNT,
  
  PREDICTION_LABEL_MAX_LENGTH,
  
  type EmotionPrediction,
  
} from "@/lib/emotion-predictions";



export const EMOTION_PREDICTION_CAPSULE_WIDTH = 132;



export function EmotionPredictionTicker({ predictions, reduceMotion }: { predictions: EmotionPrediction[]; reduceMotion: boolean }) {
  
  const colors = useColors();
  
  const [visible, setVisible] = useState(false);
  
  const [index, setIndex] = useState(0);
  
  const opacity = useSharedValue(1);
  
  const key = useMemo(() => predictions.map((prediction) => prediction.id).join("|"), [predictions]);
  
  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  
  const current = predictions[index % predictions.length] ?? predictions[0];
  

  
  useEffect(() => { setIndex(0); }, [key]);
  
  useEffect(() => {
    
    if (reduceMotion || predictions.length < 2) return;
    
    const rotation = setInterval(() => {
      
      opacity.value = withSequence(withTiming(0, { duration: 130 }), withTiming(1, { duration: 210 }));
      
      setIndex((currentIndex) => (currentIndex + 1) % predictions.length);
      
    }, 3_000);
    
    return () => clearInterval(rotation);
    
  }, [key, opacity, predictions.length, reduceMotion]);
  

  
  if (!current) return null;
  
  const close = () => setVisible(false);
  

  
  return <>
  
    <TapFeedback onPress={() => setVisible(true)} accessibilityLabel={`Open emotion prediction library. Current prediction: ${current.label}`} style={styles.capsulePressable}>
    
      <View style={[styles.capsule, { borderColor: `${current.accent}88` }]}>
      
        <Animated.View style={[styles.capsuleReading, fadeStyle]}>
        
          <View style={[styles.predictionIcon, { backgroundColor: `${current.accent}22`, borderColor: `${current.accent}55` }]}>
          
            <IconSymbol name={current.icon} size={14} color={current.accent} />
          
          </View>View>
        
          <Text numberOfLines={1} ellipsizeMode="clip" maxFontSizeMultiplier={1} style={styles.predictionLabel}>{current.label}</Text>Text>
        
        </Animated.View>Animated.View>
      
        <IconSymbol name="chevron.right" size={14} color="#B8A7E8" />
      
      </View>View>
    
    </TapFeedback>TapFeedback>
  

  
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
    
      <View style={styles.overlay}>
      
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Close prediction library" />
      
        <CommandCard accent={current.accent} style={styles.sheet}>
        
          <View style={styles.sheetTopline}>
          
            <View style={styles.sheetHeadingCopy}>
            
              <Text style={[styles.sheetEyebrow, { color: current.accent }]}>EMOTION PREDICTION LIBRARY</Text>Text>
            
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>{current.label}</Text>Text>
            
            </View>View>
          
            <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Close prediction library" hitSlop={8} style={({ pressed }) => [styles.closeButton, { borderColor: colors.border, backgroundColor: colors.background, opacity: pressed ? 0.72 : 1 }]}>
            
              <IconSymbol name="xmark" size={16} color={colors.foreground} />
            
            </Pressable>Pressable>
          
          </View>View>
        
 </>


























