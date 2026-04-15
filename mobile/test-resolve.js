try {
    console.log('Resolving react-native-reanimated/plugin...');
    console.log(require.resolve('react-native-reanimated/plugin'));

    console.log('Requiring react-native-reanimated/plugin...');
    const reanimatedPlugin = require('react-native-reanimated/plugin');
    console.log('Success!');
} catch (e) {
    console.error('Error:', e.message);
    if (e.stack) {
        console.error(e.stack);
    }
}
