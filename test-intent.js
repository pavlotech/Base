// Quick test of intent detection patterns
const testPrompts = [
    'Что на этом изображении?',
    'Нарисуй кота',
    'Опиши эту картинку',
    'Сгенерируй изображение кота',
    'Draw a cat',
    'What is in this picture?',
    'Create an image of a dog',
    'Расскажи что тут изображено',
    'Просто текст без картинок'
];

console.log('Testing intent detection patterns:\n');

testPrompts.forEach(prompt => {
    const imageGenerationPatterns = [/нарисуй/i, /сгенерируй/i, /создай изображение/i, /draw/i, /generate image/i, /create image/i, /make a picture/i, /picture of/i, /image of/i];
    const imageAnalysisPatterns = [/что на/i, /что это/i, /что изображено/i, /что тут/i, /что здесь/i, /опиш/i, /расскаж/i, /анализ/i, /what is on/i, /what's in/i, /what is in/i, /describe/i, /analyze/i, /what do you see/i, /what can you see/i];

    const isImageGeneration = imageGenerationPatterns.some(pattern => pattern.test(prompt));
    const isImageAnalysis = imageAnalysisPatterns.some(pattern => pattern.test(prompt));

    console.log(`"${prompt}"`);
    console.log(`  → Generation: ${isImageGeneration}`);
    console.log(`  → Analysis: ${isImageAnalysis}`);
    console.log();
});

console.log('✅ Pattern testing complete!');
