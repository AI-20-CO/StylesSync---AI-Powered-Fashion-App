import React, { useState } from 'react';
import { Image, View, Text, StyleSheet, ImageStyle, ViewStyle, TextStyle } from 'react-native';

interface SafeImageProps {
  source: { uri: string } | any;
  style?: ImageStyle;
  fallbackStyle?: ViewStyle;
  fallbackTextStyle?: TextStyle;
  fallbackText?: string;
  showFallbackText?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

const SafeImage: React.FC<SafeImageProps> = ({
  source,
  style,
  fallbackStyle,
  fallbackTextStyle,
  fallbackText = "Image",
  showFallbackText = false,
  onLoad,
  onError,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  // If there's an error or no source, show fallback
  if (hasError || !source?.uri) {
    return (
      <View style={[style, fallbackStyle, styles.fallbackContainer]}>
        {showFallbackText && (
          <Text style={[styles.fallbackText, fallbackTextStyle]}>
            {fallbackText}
          </Text>
        )}
      </View>
    );
  }

  return (
    <Image
      source={source}
      style={style}
      onLoad={handleLoad}
      onError={handleError}
      defaultSource={require('../assets/images/ss logo black.png')}
    />
  );
};

const styles = StyleSheet.create({
  fallbackContainer: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default SafeImage; 