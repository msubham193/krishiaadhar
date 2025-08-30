// components/FCMInitializer.js
import { useEffect } from 'react';
import FCMAuthHelper from '../utils/FCMAuthHelper';

const FCMInitializer = () => {
    useEffect(() => {
        initializeFCM();
    }, []);

    const initializeFCM = async () => {
        try {
            console.log('Initializing FCM on app startup...');

            const result = await FCMAuthHelper.checkAndSetupFCM();

            if (result.success) {
                console.log('FCM setup completed successfully');
            } else {
                console.log('FCM setup completed with issues:', result.error);
            }
        } catch (error) {
            console.log('FCM Initializer error:', error);
        }
    };

    // This is a utility component, doesn't render anything
    return null;
};

export default FCMInitializer;