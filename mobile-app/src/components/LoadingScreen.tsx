import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Image } from 'react-native';
import { PRIMARY_COLOR, WHITE, TEXT_SECONDARY } from '../utils/colors';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Laden...' }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* App Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>🚗</Text>
          </View>
          <Text style={styles.appName}>CarWash Tielt-Winge</Text>
        </View>

        {/* Loading Indicator */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={styles.loadingText}>{message}</Text>
        </View>

        {/* Tagline */}
        <Text style={styles.tagline}>
          Maak van autowassen een fluitje van een cent
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 40,
    color: WHITE,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  loadingText: {
    fontSize: 16,
    color: TEXT_SECONDARY,
    marginTop: 16,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
});

export default LoadingScreen;