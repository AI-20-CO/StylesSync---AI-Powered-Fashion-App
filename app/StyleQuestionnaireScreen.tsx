import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  StatusBar,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useStylePreferences, StylePreferences } from '../context/StylePreferencesContext';
import { useAIAnalysis } from '../context/AIAnalysisContext';

const { width, height } = Dimensions.get('window');

// Responsive breakpoints
const isSmallDevice = width < 375;
const isMediumDevice = width >= 375 && width < 414;

interface StyleQuestionnaireScreenProps {
  onComplete: () => void;
  onExit?: () => void;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  icon: any;
}

const questions: Question[] = [
  {
    id: 'gender',
    question: 'What is your gender?',
    options: ['Male', 'Female', 'Non-binary', 'Prefer not to say'],
    icon: require('../assets/images/profile.png'),
  },
  {
    id: 'age',
    question: 'What is your age range?',
    options: ['16-24', '25-34', '35-44', '45-54', '55-64', '65+'],
    icon: require('../assets/images/profile.png'),
  },
  {
    id: 'height',
    question: 'What is your height? (in cm)',
    options: ['140-150', '150-160', '160-170', '170-180', '180-190', '190-200', '200+'],
    icon: require('../assets/images/profile.png'),
  },
  {
    id: 'length',
    question: 'What length would you prefer on you?',
    options: ['Little shorter', 'Just right', 'Little longer', 'Much longer'],
    icon: require('../assets/images/profile.png'),
  },
  {
    id: 'waist',
    question: 'What is your waist? (in inches)',
    options: ['24-26', '26-28', '28-30', '30-32', '32-34', '34-36', '36-38', '38-40', '40+'],
    icon: require('../assets/images/profile.png'),
  },
  {
    id: 'bust',
    question: 'What is your bust? (in inches)',
    options: ['28-30', '30-32', '32-34', '34-36', '36-38', '38-40', '40-42', '42-44', '44+'],
    icon: require('../assets/images/profile.png'),
  },
  {
    id: 'size',
    question: 'What is your preferred clothing size?',
    options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
    icon: require('../assets/images/profile.png'),
  },
  {
    id: 'style',
    question: 'What style do you prefer most?',
    options: ['Casual', 'Formal', 'Sporty', 'Trendy', 'Classic', 'Bohemian', 'Minimalist'],
    icon: require('../assets/images/profile.png'),
  },
  {
    id: 'occasion',
    question: 'What do you shop for most often?',
    options: ['Everyday wear', 'Work attire', 'Party/Night out', 'Gym/Sports', 'Special events', 'All occasions'],
    icon: require('../assets/images/profile.png'),
  },
  {
    id: 'fit',
    question: 'What fit do you prefer?',
    options: ['Tight/Fitted', 'Regular', 'Loose/Relaxed', 'Oversized', 'Depends on item'],
    icon: require('../assets/images/profile.png'),
  },
];

const StyleQuestionnaireScreen: React.FC<StyleQuestionnaireScreenProps> = ({ onComplete, onExit }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [showDropdown, setShowDropdown] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const { setPreferences } = useStylePreferences();
  const { setAIAnalysisActive } = useAIAnalysis();

  React.useEffect(() => {
    // Animate in the current question
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentQuestionIndex]);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswerSelect = (answer: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));
    setShowDropdown(false);

    // Animate out current question
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Move to next question or complete
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        slideAnim.setValue(50);
        fadeAnim.setValue(0);
      } else {
        // All questions completed
        handleComplete();
      }
    });
  };

  const handleComplete = () => {
    // Save preferences to context
    const stylePreferences: StylePreferences = {
      gender: answers.gender || '',
      age: answers.age || '',
      height: answers.height || '',
      length: answers.length || '',
      waist: answers.waist || '',
      bust: answers.bust || '',
      size: answers.size || '',
      style: answers.style || '',
      occasion: answers.occasion || '',
      fit: answers.fit || '',
    };
    
    setPreferences(stylePreferences);
    setAIAnalysisActive(false); // Mark AI analysis as complete
    console.log('Questionnaire completed, saved preferences:', stylePreferences);
    
    Alert.alert(
      'Profile Complete! 🎉',
      'Your style profile has been created successfully. Your personalized AI recommendations are now ready!',
      [
        {
          text: 'View AI Recommendations',
          onPress: onComplete, // This will trigger navigation to AI screen
        }
      ]
    );
  };

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentQuestionIndex(prev => prev - 1);
        slideAnim.setValue(-50);
        fadeAnim.setValue(0);
      });
    } else {
      // Going back from first question - exit questionnaire
      setAIAnalysisActive(false);
      if (onExit) {
        onExit();
      }
    }
  };

  return (
    <LinearGradient
      colors={['#000000', '#404040', '#ffffff']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goToPrevious}>
          <View style={styles.backIconContainer}>
            <Image source={require('../assets/images/arrow left logo.png')} style={styles.backIcon} />
          </View>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Style Profile</Text>
          <Text style={styles.headerSubtitle}>Question {currentQuestionIndex + 1} of {questions.length}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <Animated.View 
            style={[
              styles.progressBar,
              { width: `${progress}%` }
            ]}
          />
        </View>
        <Text style={styles.progressText}>{Math.round(progress)}% Complete</Text>
      </View>

      {/* Question Card */}
      <View style={styles.questionContainer}>
        <Animated.View 
          style={[
            styles.questionCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <View style={styles.questionIconContainer}>
            <View style={styles.questionIconBackground}>
              <Image source={currentQuestion.icon} style={styles.questionIcon} />
            </View>
          </View>
          
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
          
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Text style={[
              styles.dropdownButtonText,
              { color: answers[currentQuestion.id] ? '#fff' : '#ccc' }
            ]}>
              {answers[currentQuestion.id] || 'Select an option...'}
            </Text>
            <Animated.View 
              style={[
                styles.dropdownArrow,
                {
                  transform: [{ rotate: showDropdown ? '180deg' : '0deg' }]
                }
              ]}
            >
              <Image 
                source={require('../assets/images/arrow right logo.png')} 
                style={[styles.arrowIcon, { transform: [{ rotate: '90deg' }] }]} 
              />
            </Animated.View>
          </TouchableOpacity>

          {/* Dropdown Options */}
          {showDropdown && (
            <Animated.View style={styles.dropdownContainer}>
              <ScrollView 
                style={styles.dropdownScrollView}
                showsVerticalScrollIndicator={false}
              >
                {currentQuestion.options.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dropdownOption,
                      answers[currentQuestion.id] === option && styles.selectedOption
                    ]}
                    onPress={() => handleAnswerSelect(option)}
                  >
                    <Text style={[
                      styles.dropdownOptionText,
                      answers[currentQuestion.id] === option && styles.selectedOptionText
                    ]}>
                      {option}
                    </Text>
                    {answers[currentQuestion.id] === option && (
                      <View style={styles.checkMark}>
                        <Text style={styles.checkMarkText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Animated.View>
          )}
        </Animated.View>
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomContainer}>
        <View style={styles.navigationHints}>
          <View style={styles.hintItem}>
            <View style={styles.hintDot} />
            <Text style={styles.hintText}>Select your preference</Text>
          </View>
          <View style={styles.hintItem}>
            <View style={styles.hintDot} />
            <Text style={styles.hintText}>Auto-advance to next question</Text>
          </View>
        </View>

        {/* AI Branding */}
        <View style={styles.brandingContainer}>
          <View style={styles.brandingCard}>
            <View style={styles.aiLogoContainer}>
              <Image source={require('../assets/images/ai.png')} style={styles.aiLogo} />
            </View>
            <Text style={styles.brandingText}>AI-Powered Recommendations</Text>
            <Text style={styles.brandingSubtext}>
              Building your personalized style profile
            </Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  backIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  backIcon: {
    width: 18,
    height: 18,
    tintColor: '#fff',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: isSmallDevice ? 20 : isMediumDevice ? 22 : 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  progressBackground: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4,
    shadowColor: '#fff',
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  progressText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  questionContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    overflow: 'visible',
  },
  questionCard: {
    backgroundColor: 'rgba(64, 64, 64, 0.9)',
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'visible',
  },
  questionIconContainer: {
    marginBottom: 25,
  },
  questionIconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 5 },
  },
  questionIcon: {
    width: 40,
    height: 40,
    tintColor: '#ffffff',
  },
  questionText: {
    fontSize: isSmallDevice ? 20 : isMediumDevice ? 22 : 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 30,
  },
  dropdownButton: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    position: 'relative',
  },
  dropdownButtonText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  dropdownArrow: {
    marginLeft: 10,
  },
  arrowIcon: {
    width: 14,
    height: 14,
    tintColor: '#fff',
  },
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 15,
    maxHeight: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
    zIndex: 1000,
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  selectedOption: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  selectedOptionText: {
    color: '#000000',
    fontWeight: '700',
  },
  checkMark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMarkText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  navigationHints: {
    marginBottom: 20,
  },
  hintItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  hintDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    marginRight: 10,
  },
  hintText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  brandingContainer: {
    alignItems: 'center',
  },
  brandingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 25,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  aiLogoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#fff',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  aiLogo: {
    width: 28,
    height: 28,
    tintColor: '#fff',
  },
  brandingText: {
    fontSize: isSmallDevice ? 16 : isMediumDevice ? 17 : 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
    textAlign: 'center',
  },
  brandingSubtext: {
    fontSize: isSmallDevice ? 12 : isMediumDevice ? 13 : 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default StyleQuestionnaireScreen; 