// Test the new soyjak generation logic
function testSoyjakLogic(prompt, hasUserMention = false) {
    const hasSoyjakKeywords = prompt.toLowerCase().includes('soyjak') || prompt.toLowerCase().includes('сойджак');
    const hasOtherStyle = /\b(?:anime|realistic|photorealistic|cartoon|pixel|3d|abstract|minimalist|watercolor|oil|sketch|painting|drawing|portrait|landscape|digital|traditional)\b/i.test(prompt);

    const shouldAddSoyjak = (hasSoyjakKeywords || hasUserMention) && !hasOtherStyle;

    return {
        prompt,
        hasSoyjakKeywords,
        hasUserMention,
        hasOtherStyle,
        shouldAddSoyjak,
        result: shouldAddSoyjak ? `${prompt} in soyjak meme style` : prompt
    };
}

console.log('Testing New Soyjak Logic:\n');

const testCases = [
    // Should NOT add soyjak
    { prompt: 'Нарисуй кота', mention: false },
    { prompt: 'Draw a cat', mention: false },
    { prompt: 'Generate image of dog', mention: false },

    // Should add soyjak - explicit keyword
    { prompt: 'Нарисуй кота в стиле сойджака', mention: false },
    { prompt: 'Draw a cat soyjak', mention: false },

    // Should add soyjak - user mention
    { prompt: 'Нарисуй кота', mention: true },
    { prompt: 'Draw a picture', mention: true },

    // Should NOT add soyjak - other style specified
    { prompt: 'Нарисуй кота в стиле аниме', mention: false },
    { prompt: 'Draw cat in realistic style', mention: false },
    { prompt: 'Generate image of dog cartoon', mention: false },

    // Edge cases
    { prompt: 'Нарисуй кота в стиле сойджака но реалистичного', mention: false },
    { prompt: 'Draw anime soyjak cat', mention: false },
];

testCases.forEach(({ prompt, mention }) => {
    const result = testSoyjakLogic(prompt, mention);
    const status = result.shouldAddSoyjak ? '✅ ADD SOYJAK' : '❌ NO SOYJAK';

    console.log(`${status} ${result.prompt}${mention ? ' [@mention]' : ''}`);
    console.log(`   Keywords: ${result.hasSoyjakKeywords}, Mention: ${result.hasUserMention}, Other Style: ${result.hasOtherStyle}`);
    if (result.shouldAddSoyjak) {
        console.log(`   → "${result.result}"`);
    }
    console.log();
});

console.log('✅ Soyjak logic testing complete!');
