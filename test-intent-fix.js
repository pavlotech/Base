// Test the fixed intent detection patterns
const testPrompts = [
    // Should be generation (fixed)
    'Нарисуй кота',
    'Сгенерируй изображение',
    'Draw a picture',

    // Should NOT be generation (the problem case)
    'тут генерировался пользователь как изображение кстати расскажи мне про него',
    'Пользователь генерировал изображение',
    'Изображение было сгенерировано',

    // Should be analysis
    'Что на этом изображении?',
    'Опиши картинку',

    // Should be text (no matches)
    'Расскажи про пользователя',
    'Кто такой этот человек?'
];

console.log('Testing FIXED intent detection patterns:\n');

testPrompts.forEach(prompt => {
    const imageGenerationPatterns = [/(?:^|\s)нарисуй(?:\s|$)/i, /(?:^|\s)сгенерируй(?:\s|$)/i, /(?:^|\s)создай изображение(?:\s|$)/i, /\bdraw(?:\s|$)/i, /(?:^|\s)generate image(?:\s|$)/i, /(?:^|\s)create image(?:\s|$)/i, /(?:^|\s)make a picture(?:\s|$)/i, /(?:^|\s)picture of(?:\s|$)/i, /(?:^|\s)image of(?:\s|$)/i];
    const imageAnalysisPatterns = [/(?:^|\s)что на(?:\s|$)/i, /(?:^|\s)что это(?:\s|$)/i, /(?:^|\s)что изображено(?:\s|$)/i, /(?:^|\s)что тут(?:\s|$)/i, /(?:^|\s)что здесь(?:\s|$)/i, /(?:^|\s)опиш(?:\s|$)/i, /(?:^|\s)расскаж(?:\s|$)/i, /(?:^|\s)анализ(?:\s|$)/i, /(?:^|\s)what is on(?:\s|$)/i, /(?:^|\s)what's in(?:\s|$)/i, /(?:^|\s)what is in(?:\s|$)/i, /(?:^|\s)describe(?:\s|$)/i, /(?:^|\s)analyze(?:\s|$)/i, /(?:^|\s)what do you see(?:\s|$)/i, /(?:^|\s)what can you see(?:\s|$)/i];

    const isImageGeneration = imageGenerationPatterns.some(pattern => pattern.test(prompt));
    const isImageAnalysis = imageAnalysisPatterns.some(pattern => pattern.test(prompt));

    console.log(`"${prompt}"`);
    console.log(`  → Generation: ${isImageGeneration}`);
    console.log(`  → Analysis: ${isImageAnalysis}`);
    console.log();
});

console.log('✅ Fixed pattern testing complete!');
