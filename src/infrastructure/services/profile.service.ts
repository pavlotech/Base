import sharp from "sharp";

interface ProfileBadge {
    name: string;
    imageUrl: string;
    badgeUrl: string;
}

interface ProfileAward {
    name: string;
    imageUrl: string;
    animatedImageUrl?: string;
}

interface SteamProfileData {
    steamId: string;
    personaname: string;
    avatarUrl: string;
    profileUrl: string;
    gamesCount: number;
    level: number;
    backgroundUrl: string | null;
    badges: ProfileBadge[];
    awards: ProfileAward[];
}

export class SteamProfileService {
    async fetchSteamProfile(steamId: string, steamApiKey: string): Promise<SteamProfileData | null> {
        try {
            const [playerResponse, gamesResponse, levelResponse] = await Promise.all([
                fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${steamApiKey}&steamids=${steamId}`),
                fetch(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${steamApiKey}&steamid=${steamId}&include_appinfo=1&include_played_free_games=1`),
                fetch(`https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?key=${steamApiKey}&steamid=${steamId}`)
            ]);

            const playerData = await playerResponse.json();
            const gamesData = await gamesResponse.json();
            const levelData = await levelResponse.json();

            const player = playerData.response?.players?.[0];
            if (!player) return null;

            const profileUrl = player.profileurl || `https://steamcommunity.com/profiles/${steamId}`;

            // Filter out DLC from games list
            const allGames = gamesData.response?.games || [];
            const filteredGames = allGames.filter((game: any) => {
                // Common DLC patterns to exclude
                const name = game.name?.toLowerCase() || '';
                const isDLC = name.includes('dlc') ||
                    name.includes('downloadable content') ||
                    name.includes('expansion') ||
                    name.includes('season pass') ||
                    name.includes('soundtrack') ||
                    name.includes('artbook');
                return !isDLC;
            });

            // Try to scrape the actual background URL from the profile page
            let backgroundUrl = null;
            let badges: ProfileBadge[] = [];
            let awards: ProfileAward[] = [];

            try {
                const profilePageResponse = await fetch(profileUrl);
                const profilePageHtml = await profilePageResponse.text();

                // 1. Check for animated background (video poster)
                // <video ... poster="URL">
                const videoPosterMatch = profilePageHtml.match(/<video[^>]+poster="([^"]+)"/);
                if (videoPosterMatch && videoPosterMatch[1]) {
                    backgroundUrl = videoPosterMatch[1];
                } else {
                    // 2. Check for standard background image
                    // <div class="profile_background_image_content " style="background-image: url('URL');">
                    const bgImageMatch = profilePageHtml.match(/class="profile_background_image_content[^"]*"[^>]*style="background-image:\s*url\('([^']+)'\)/);
                    if (bgImageMatch && bgImageMatch[1]) {
                        backgroundUrl = bgImageMatch[1];
                    } else {
                        // 3. Check for background in no_header div
                        // <div class="no_header profile_page has_profile_background  " style="background-image: url( 'URL' );">
                        const noHeaderBgMatch = profilePageHtml.match(/class="[^"]*has_profile_background[^"]*"[^>]*style="background-image:\s*url\(\s*'([^']+)'\s*\);"/);
                        if (noHeaderBgMatch && noHeaderBgMatch[1]) {
                            backgroundUrl = noHeaderBgMatch[1];
                        }
                    }
                }

                // Parse profile badges
                const badgeRegex = /<div class="profile_badges_badge[^"]*"[^>]*data-tooltip-html="([^"]*)"[^>]*>[\s\S]*?<a href="([^"]+)">[\s\S]*?<img src="([^"]+)"/g;
                let badgeMatch;
                while ((badgeMatch = badgeRegex.exec(profilePageHtml)) !== null) {
                    const tooltipHtml = badgeMatch[1];
                    const badgeUrl = badgeMatch[2];
                    const imageUrl = badgeMatch[3];

                    // Skip if it's an award (contains reactions/still or reactions/animated in URL)
                    if (imageUrl.includes('reactions/still') || imageUrl.includes('reactions/animated')) {
                        continue;
                    }

                    // Extract badge name from tooltip (remove HTML tags)
                    const badgeName = tooltipHtml.replace(/<br>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();

                    badges.push({
                        name: badgeName,
                        imageUrl: imageUrl,
                        badgeUrl: badgeUrl.startsWith('http') ? badgeUrl : `https://steamcommunity.com${badgeUrl}`
                    });
                }

                // Parse profile awards
                const awardRegex = /<div class="profile_badges_badge[^"]*"[^>]*data-tooltip-html="([^"]*)"[^>]*>[\s\S]*?<img src="([^"]+)"[^>]*(?:data-animate-on-hover-src="([^"]+)")?/g;
                let awardMatch;
                while ((awardMatch = awardRegex.exec(profilePageHtml)) !== null) {
                    const tooltipHtml = awardMatch[1];
                    const imageUrl = awardMatch[2];
                    const animatedImageUrl = awardMatch[3];

                    // Only add if it's an award (contains reactions/still or reactions/animated in URL)
                    if (imageUrl.includes('reactions/still') || imageUrl.includes('reactions/animated')) {
                        const awardName = tooltipHtml.replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();

                        awards.push({
                            name: awardName,
                            imageUrl: imageUrl,
                            animatedImageUrl: animatedImageUrl
                        });
                    }
                }
            } catch (e) {
                console.error("Failed to scrape profile background:", e);
            }

            // Fallback to API constructed URL if scraping failed (though API URL is often unreliable for custom backgrounds)
            if (!backgroundUrl && player.profilebackground) {
                backgroundUrl = `https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/items/${player.profilebackground}`;
            }

            return {
                steamId,
                personaname: player.personaname || 'Unknown',
                avatarUrl: player.avatarfull || player.avatarmedium || player.avatar,
                profileUrl,
                gamesCount: filteredGames.length,
                level: levelData.response?.player_level || 0,
                backgroundUrl,
                badges,
                awards
            };
        } catch (error) {
            throw new Error(`Failed to fetch Steam profile: ${error}`);
        }
    }

    async resolveSteamId(input: string, steamApiKey: string): Promise<string> {
        const resolveVanityURL = async (vanityName: string): Promise<string> => {
            const response = await fetch(`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${steamApiKey}&vanityurl=${vanityName}`);
            if (!response.ok) throw new Error('Failed to fetch data from Steam API.');
            const data = await response.json();
            if (data.response?.success === 1) return data.response.steamid;
            throw new Error('Не вдалося отримати Steam ID із наданого URL.');
        };

        const isSteamID = /^\d{17}$/.test(input);
        const isVanityURL = /steamcommunity\.com\/id\//.test(input);
        const isProfileURL = /steamcommunity\.com\/profiles\//.test(input);

        return isSteamID
            ? input
            : isVanityURL
                ? resolveVanityURL(input.split('/id/')[1].split('/')[0])
                : isProfileURL
                    ? input.split('/profiles/')[1].split('/')[0]
                    : Promise.reject(new Error('Невірний Steam ID або посилання на профіль.'));
    }

    async generateProfileCard(profileData: SteamProfileData): Promise<Buffer> {
        const width = 1260;
        const height = 540; // 21:9 Aspect Ratio

        // Helper to safely fetch and process image
        const safeFetchImage = async (url: string): Promise<Buffer | null> => {
            try {
                const response = await fetch(url);
                if (!response.ok) return null;
                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                await sharp(buffer).metadata(); // Verify image
                return buffer;
            } catch (e) {
                console.error(`Failed to fetch/process image from ${url}:`, e);
                return null;
            }
        };

        const avatarBuffer = await safeFetchImage(profileData.avatarUrl);

        const finalAvatarBuffer = avatarBuffer || await sharp({
            create: {
                width: 180,
                height: 180,
                channels: 4,
                background: { r: 100, g: 100, b: 100, alpha: 1 }
            }
        }).png().toBuffer();

        const backgroundBuffer = profileData.backgroundUrl
            ? await safeFetchImage(profileData.backgroundUrl)
            : null;

        // Create background
        // fit: 'cover' + position: 'center' ensures it fills the 21:9 area, cropping top/bottom as needed
        const background = backgroundBuffer
            ? await sharp(backgroundBuffer)
                .resize(width, height, { fit: 'cover', position: 'center' })
                .blur(3)
                .modulate({ brightness: 0.7 })
                .png()
                .toBuffer()
            : await sharp({
                create: {
                    width,
                    height,
                    channels: 4,
                    background: { r: 20, g: 25, b: 35, alpha: 1 }
                }
            })
                .png()
                .toBuffer();

        // Circular Avatar with Border
        const avatarSize = 180;
        const borderSvg = `<svg width="${avatarSize}" height="${avatarSize}"><circle cx="${avatarSize / 2}" cy="${avatarSize / 2}" r="${(avatarSize / 2) - 3}" fill="none" stroke="white" stroke-width="6"/></svg>`;
        const maskSvg = `<svg width="${avatarSize}" height="${avatarSize}"><circle cx="${avatarSize / 2}" cy="${avatarSize / 2}" r="${avatarSize / 2}" /></svg>`;

        const avatarWithBorder = await sharp(finalAvatarBuffer)
            .resize(avatarSize, avatarSize)
            .composite([{
                input: Buffer.from(borderSvg),
                blend: 'over'
            }])
            .png()
            .toBuffer()
            .then(buffer => sharp(buffer)
                .composite([{
                    input: Buffer.from(maskSvg),
                    blend: 'dest-in'
                }])
                .png()
                .toBuffer()
            );

        const sanitizedName = profileData.personaname.replace(/[<>&'"]/g, '');

        // SVG for Text and Layout
        const svgImage = `
            <svg width="${width}" height="${height}">
                <defs>
                    <style>
                        .name { fill: white; font-family: 'Arial', sans-serif; font-size: 56px; font-weight: 900; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.5)); }
                        .label { fill: #a3b3c1; font-family: 'Arial', sans-serif; font-size: 20px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; }
                        .value { fill: white; font-family: 'Arial', sans-serif; font-size: 36px; font-weight: bold; }
                        .level-badge { fill: #2a475e; stroke: #66c0f4; stroke-width: 2; }
                        .level-text { fill: white; font-family: 'Arial', sans-serif; font-size: 24px; font-weight: bold; text-anchor: middle; dominant-baseline: middle; }
                    </style>
                    <linearGradient id="cardGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stop-color="rgba(23, 26, 33, 0.95)"/>
                        <stop offset="100%" stop-color="rgba(23, 26, 33, 0.5)"/>
                    </linearGradient>
                </defs>
                
                <!-- Glassmorphism Card Background -->
                <rect x="60" y="60" width="${width - 120}" height="${height - 120}" rx="24" ry="24" fill="url(#cardGradient)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>

                <!-- Text Content -->
                <text x="300" y="180" class="name">${sanitizedName}</text>
                
                <!-- Stats Grid -->
                <!-- Level -->
                <text x="300" y="270" class="label">Рівень</text>
                <circle cx="325" cy="315" r="28" class="level-badge"/>
                <text x="325" y="317" class="level-text">${profileData.level}</text>

                <!-- Games -->
                <text x="440" y="270" class="label">Ігри</text>
                <text x="440" y="325" class="value">${profileData.gamesCount}</text>

                <!-- Steam ID -->
                <text x="640" y="270" class="label">Steam ID</text>
                <text x="640" y="325" class="value" style="font-size: 24px; fill: #8f98a0;">${profileData.steamId}</text>

                <!-- Badges Section -->
                ${profileData.badges.length > 0 ? `<text x="300" y="390" class="label">Значки</text>` : ''}

                <!-- Awards Section -->
                ${profileData.awards.length > 0 ? `<text x="600" y="390" class="label">Нагороди</text>` : ''}

            </svg>
        `;


        const svgBuffer = Buffer.from(svgImage);

        // Fetch and prepare badge images (limit to 4)
        const badgeImages = await Promise.all(
            profileData.badges.slice(0, 4).map(async (badge, index) => {
                const badgeBuffer = await safeFetchImage(badge.imageUrl);
                if (!badgeBuffer) return null;

                try {
                    const resizedBadge = await sharp(badgeBuffer)
                        .resize(48, 48, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                        .png()
                        .toBuffer();

                    return {
                        input: resizedBadge,
                        top: height - 120,
                        left: 300 + (index * 60)
                    };
                } catch (e) {
                    console.error(`Failed to process badge image:`, e);
                    return null;
                }
            })
        );

        // Fetch and prepare award images (limit to 4)
        const awardImages = await Promise.all(
            profileData.awards.slice(0, 4).map(async (award, index) => {
                const awardBuffer = await safeFetchImage(award.imageUrl);
                if (!awardBuffer) return null;

                try {
                    const resizedAward = await sharp(awardBuffer)
                        .resize(48, 48, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                        .png()
                        .toBuffer();

                    return {
                        input: resizedAward,
                        top: height - 120,
                        left: 600 + (index * 60)
                    };
                } catch (e) {
                    console.error(`Failed to process award image:`, e);
                    return null;
                }
            })
        );

        // Combine all composite layers
        const compositeArray = [
            {
                input: svgBuffer,
                blend: 'over' as const
            },
            {
                input: avatarWithBorder,
                top: 120,
                left: 100
            },
            ...badgeImages.filter(img => img !== null) as any[],
            ...awardImages.filter(img => img !== null) as any[]
        ];

        const image = await sharp(background)
            .composite(compositeArray)
            .png()
            .toBuffer();

        return image;
    }
}
