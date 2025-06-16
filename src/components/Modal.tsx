<Modal
  animationType="slide"
  transparent={true}
  visible={modalVisible}
  onRequestClose={() => setModalVisible(false)}>
  <View
    style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 16,
      backgroundColor: '#fff',
      elevation: 5,
      position: 'static',
    }}>
    <Text style={styles.modalTitle}>Create a New Project</Text>
  </View>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <View style={styles.stepIndicatorContainer}>
        <View style={styles.stepItem}>
          <View
            style={[
              styles.stepCircle,
              step >= 1 ? styles.activeCircle : styles.inactiveCircle,
            ]}
          />
          <Text
            style={[
              styles.stepText,
              step >= 1 ? styles.activeStepText : styles.inactiveStepText,
            ]}>
            Project Category
          </Text>
        </View>

        <View style={[step >= 2 ? styles.inActiveLine : styles.line]} />

        <View style={styles.stepItem}>
          <View
            style={[
              styles.stepCircle,
              step >= 2 ? styles.activeCircle : styles.inactiveCircle,
            ]}
          />
          <Text
            style={[
              styles.stepText,
              step >= 2 ? styles.activeStepText : styles.inactiveStepText,
            ]}>
            Project Details
          </Text>
        </View>

        <View style={[step >= 3 ? styles.inActiveLine : styles.line]} />

        <View style={styles.stepItem}>
          <View
            style={[
              styles.stepCircle,
              step >= 3 ? styles.activeCircle : styles.inactiveCircle,
            ]}
          />
          <Text
            style={[
              styles.stepText,
              step >= 3 ? styles.activeStepText : styles.inactiveStepText,
            ]}>
            Project Creation
          </Text>
        </View>
      </View>

      {renderStepContent()}

      <TouchableOpacity style={styles.nextButton} onPress={handleNextStep}>
        <Text style={styles.nextButtonText}>
          {step === 3 ? 'Create' : 'Next'}
        </Text>
        <MaterialIcons name="keyboard-arrow-right" size={25} color="white" />
      </TouchableOpacity>

      {step > 1 && (
        <TouchableOpacity style={styles.backButton} onPress={handleBackStep}>
          <MaterialIcons name="keyboard-arrow-left" size={25} color="white" />
          <Text style={styles.nextButtonText}> Back</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
</Modal>;
