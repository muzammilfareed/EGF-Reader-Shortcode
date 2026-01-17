(() =>
{
    "use strict";

    // -------------------------
    // Boot all instances
    // -------------------------

    function bootAll()
    {
        const roots = document.querySelectorAll('[data-egf-reader="1"]');

        roots.forEach((root) =>
        {
            const gameUrl = (root.getAttribute("data-game-url") || "").trim();
            const defaultLang = (root.getAttribute("data-default-lang") || "en").trim() || "en";
            const defaultThemeRaw = (root.getAttribute("data-default-theme") || "light").trim().toLowerCase();
            const defaultTheme = (defaultThemeRaw === "dark") ? "dark" : "light";
            const noCache = (root.getAttribute("data-nocache") || "1").trim() === "1";

            createEgfReaderWp(root,
            {
                gameUrl,
                defaultLang,
                defaultTheme,
                persist: false,
                noCache
            });
        });
    }

    if (document.readyState === "loading")
    {
        document.addEventListener("DOMContentLoaded", bootAll);
    }

    else
    {
        bootAll();
    }

    // -------------------------
    // Instance factory (WP)
    // -------------------------

    function createEgfReaderWp(root, opts)
    {
        const gameUrl = String(opts?.gameUrl || "").trim();

        if (!gameUrl)
        {
            root.innerHTML = `<div class="notice warn"><b>EGF Reader:</b> Missing game URL (data-game-url).</div>`;

            return;
        }

        const noCacheFetch = (opts?.noCache !== false); // NO CACHE for the EGF fetch
        const defaultLang = String(opts?.defaultLang || "en").trim() || "en";
        const defaultTheme = (String(opts?.defaultTheme || "light").toLowerCase() === "dark") ? "dark" : "light";

        const $ = (key) => root.querySelector(`[data-egf="${key}"]`);

        const setText = (el, txt) =>
        {
            if (el) el.textContent = String(txt ?? "");
        };
        const setHtml = (el, html) =>
        {
            if (el) el.innerHTML = String(html ?? "");
        };
        const setAttr = (el, k, v) =>
        {
            if (el) el.setAttribute(k, String(v));
        };
        const rmAttr = (el, k) =>
        {
            if (el) el.removeAttribute(k);
        };

        function clamp01(x)
        {
            return Math.max(0, Math.min(1, x));
        }

        function escapeHtml(s)
        {
            return String(s).replace(/[&<>"']/g, c => (
                {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#39;"
                }
                [c]));
        }

        // -------------------------
        // Autoplay policy helper
        // -------------------------

        let autoplayArmed = false;
        const pendingAutoplay = new Set();

        function armAutoplayOnFirstGesture()
        {
            if (autoplayArmed) return;
            autoplayArmed = true;

            const resume = async () =>
            {
                // Attempt to restart everything that was blocked

                for (const el of Array.from(pendingAutoplay))
                {
                    try
                    {
                        await el.play();
                        pendingAutoplay.delete(el);
                    }
                    catch
                    {}
                }
            };

            // Pointer = click/tap, keydown = keyboard

            window.addEventListener("pointerdown", resume,
            {
                once: true,
                capture: true
            });
            window.addEventListener("keydown", resume,
            {
                once: true,
                capture: true
            });
        }

        async function safePlay(mediaEl,
        {
            queueIfBlocked = true
        } = {})
        {
            if (!mediaEl) return false;
            try
            {
                await mediaEl.play();
                return true;
            }
            catch (e)
            {
                // Autoplay blocked → we queue it up

                if (queueIfBlocked)
                {
                    pendingAutoplay.add(mediaEl);
                    armAutoplayOnFirstGesture();
                }
                return false;
            }
        }

        // -------------------------
        // BG policy (per scene)
        // -------------------------

        let bgMode = "auto";

        function computeBgModeForRole(role)
        {
            // EGF 1.1: do not exclude background_audio by role.
            // The scope decides, and the mainIsPrimary => pause BG logic handles the "primary audio" cases.
    
            return "auto";
        }

        function shouldPlayForegroundForRole(role)
        {
            // EGF 1.1: do not exclude foreground_audio by role.
            // scene-ref decides, and attachMainMedia() will pause FG if a primary audio is playing.
    
            return true;
        }
        
        function storageKey(suffix)
        {
            const base = gameUrl.slice(0, 200);
            return `egf_reader::${base}::${suffix}`;
        }

        const rolePill = $("rolePill");
        const roleProgressText = $("roleProgressText");
        const roleBarFill = $("roleBarFill");

        const aboutCoverWrap = $("aboutCoverWrap");
        const aboutCover = $("aboutCover");

        const btnAbout = $("btnAbout");
        const aboutModal = $("aboutModal");
        const aboutBackdrop = $("aboutBackdrop");
        const btnCloseAbout = $("btnCloseAbout");

        const btnSettings = $("btnSettings");
        const settingsModal = $("settingsModal");
        const settingsBackdrop = $("settingsBackdrop");
        const btnCloseSettings = $("btnCloseSettings");

        const btnReset = $("btnReset");

        const btnPause = $("btnPause");
        const btnScore = $("btnScore");

        const scoreModal = $("scoreModal");
        const scoreBackdrop = $("scoreBackdrop");
        const btnCloseScore = $("btnCloseScore");

        const btnResumeOverlay = $("btnResumeOverlay");
        const pauseOverlay = $("pauseOverlay");
        const sceneWrap = $("sceneWrap");

        const warningsBox = $("warnings");

        const kvVer = $("kvVer");
        const kvTitle = $("kvTitle");
        const kvCreator = $("kvCreator");
        const kvDesc = $("kvDesc");
        const kvDate = $("kvDate");
        const kvModified = $("kvModified");
        const kvCurrentScene = $("kvCurrentScene");
        const kvCurrentRole = $("kvCurrentRole");
        const kvCurrentSceneId = $("kvCurrentSceneId");
        const kvWrong = $("kvWrong");

        const sceneName = $("sceneName");
        const sceneSub = $("sceneSub");
        const sceneContent = $("sceneContent");
        const sceneFooter = $("sceneFooter");
        const progressBox = $("progressBox");
        const progressText = $("progressText");
        const barFill = $("barFill");

        const bgMute = $("bgMute");
        const fgMute = $("fgMute");
        const bgVol = $("bgVol");
        const fgVol = $("fgVol");
        const bgVolPct = $("bgVolPct");
        const fgVolPct = $("fgVolPct");

        const langSelect = $("langSelect");
        const langLabel = $("langLabel");
        const langHint = $("langHint");

        const scoreProgressPct = $("scoreProgressPct");

        const themeToggle = $("themeToggle");
        const themeLabel = themeToggle?.parentElement?.querySelector("span") || null;

        if (!sceneContent || !sceneFooter || !sceneName || !sceneSub)
        {
            console.warn("EGF Reader: missing required nodes in instance", root);

            return;
        }

        let currentLang = "en";

        function t(key, vars = {})
        {
            const dict = (window.I18N && window.I18N[currentLang]) || (window.I18N && window.I18N.en) ||
            {};
            let s = (dict[key] ?? (window.I18N?.en?.[key]) ?? key);
            for (const k of Object.keys(vars)) s = s.replaceAll(`{${k}}`, String(vars[k]));
            return s;
        }

        function applyTheme(mode)
        {
            if (mode === "light")
            {
                root.setAttribute("data-theme", "light");
                if (themeToggle) themeToggle.checked = false;
                if (themeLabel) setText(themeLabel, t("darkMode"));
            }
            else
            {
                root.removeAttribute("data-theme");
                if (themeToggle) themeToggle.checked = true;
                if (themeLabel) setText(themeLabel, t("darkMode"));
            }

            // Important: the gradient can change with the theme.

            syncScoreProgressGradient();
        }

        function applyLanguage(lang)
        {
            const I18N = window.I18N ||
            {};
            const allowed = new Set(Object.keys(I18N).length ? Object.keys(I18N) : ["en"]);
            currentLang = resolveLangKey(lang);

            const brandText = root.querySelector(".brand span:last-child");
            if (brandText) setText(brandText, t("appTitle"));

            if (btnPause)
            {
                btnPause.title = t("pauseTitle");
                setText(btnPause, isPaused ? t("resume") : t("pause"));
            }
            if (btnScore)
            {
                btnScore.title = t("scoreTitle");
                setText(btnScore, t("score"));
            }
            if (btnAbout)
            {
                btnAbout.title = t("aboutTitle");
                setText(btnAbout, t("about"));
            }
            if (btnSettings)
            {
                btnSettings.title = t("settingsTitle");
                setText(btnSettings, t("settings"));
            }

            const pTitle = pauseOverlay?.querySelector("h3");
            const pDesc = pauseOverlay?.querySelector("p");
            if (pTitle) setText(pTitle, t("pausedTitle"));
            if (pDesc) setText(pDesc, t("pausedDesc"));
            if (btnResumeOverlay) setText(btnResumeOverlay, t("resume"));

            if (rolePill) rolePill.title = t("rolePillTitle");

            if (langLabel) setText(langLabel, t("langName"));
            if (langHint) setText(langHint, t("langHint"));

            if (langSelect)
            {
                const LANG_LABEL_KEYS = {
                    en: "langEN",
                    fr: "langFR",
                    es: "langES",
                    pt: "langPT",
                    hi: "langHI",
                    zh: "langZH",
                    ar: "langAR",
                    ur: "langUR",
                    ru: "langRU",
                };
                for (const [value, key] of Object.entries(LANG_LABEL_KEYS))
                {
                    const opt = langSelect.querySelector(`option[value="${value}"]`);
                    if (opt) setText(opt, t(key));
                }
            }

            const settingsRows = settingsModal?.querySelectorAll(".settingsRow") || [];

            if (settingsRows[0])
            {
                const n = settingsRows[0].querySelector(".left .name");
                const h = settingsRows[0].querySelector(".left .hint");
                if (n) setText(n, t("bgVolName"));
                if (h) setText(h, t("bgVolHint"));
                const muteSpan = settingsRows[0].querySelector(".toggle span");
                if (muteSpan) setText(muteSpan, t("mute"));
            }

            if (settingsRows[1])
            {
                const n = settingsRows[1].querySelector(".left .name");
                const h = settingsRows[1].querySelector(".left .hint");
                if (n) setText(n, t("fgVolName"));
                if (h) setText(h, t("fgVolHint"));
                const muteSpan = settingsRows[1].querySelector(".toggle span");
                if (muteSpan) setText(muteSpan, t("mute"));
            }

            if (settingsRows[2])
            {
                const n = settingsRows[2].querySelector(".left .name");
                const h = settingsRows[2].querySelector(".left .hint");
                if (n) setText(n, t("themeName"));
                if (h) setText(h, t("themeHint"));
            }

            const resetRow = Array.from(settingsRows).find(r => r.querySelector('[data-egf="btnReset"]'));
            if (resetRow)
            {
                const n = resetRow.querySelector(".left .name");
                const h = resetRow.querySelector(".left .hint");
                if (n) setText(n, t("resetName"));
                if (h) setText(h, t("resetHint"));
                if (btnReset)
                {
                    setText(btnReset, t("reset"));
                    btnReset.title = t("resetTitle");
                }
            }

            const aTitle = aboutModal ? aboutModal.querySelector(".panelHd .title span") : null;
            const sTitle = settingsModal ? settingsModal.querySelector(".panelHd .title span") : null;
            const scTitle = scoreModal ? scoreModal.querySelector(".panelHd .title span") : null;
            setText(aTitle, t("about"));
            setText(sTitle, t("settings"));
            setText(scTitle, t("score"));

            if (btnCloseAbout) setText(btnCloseAbout, t("close"));
            if (btnCloseSettings) setText(btnCloseSettings, t("close"));
            if (btnCloseScore) setText(btnCloseScore, t("close"));

            const aPanel = aboutModal ? aboutModal.querySelector(".panel") : null;
            const sPanel = settingsModal ? settingsModal.querySelector(".panel") : null;
            const scPanel = scoreModal ? scoreModal.querySelector(".panel") : null;
            if (aPanel) aPanel.setAttribute("aria-label", t("aboutAria"));
            if (sPanel) sPanel.setAttribute("aria-label", t("settingsAria"));
            if (scPanel) scPanel.setAttribute("aria-label", t("scoreAria"));

            const aboutKv = aboutModal?.querySelectorAll(".kv .k") || [];
            if (aboutKv.length >= 6)
            {
                setText(aboutKv[0], t("aboutGameName"));
                setText(aboutKv[1], t("aboutCreator"));
                setText(aboutKv[2], t("aboutDesc"));
                setText(aboutKv[3], t("aboutDate"));
                setText(aboutKv[4], t("aboutModified"));
                setText(aboutKv[5], t("aboutVer"));
            }

            const scoreKv = scoreModal?.querySelectorAll(".kv .k") || [];
            if (scoreKv.length >= 5)
            {
                setText(scoreKv[0], t("scoreCurrentScene"));
                setText(scoreKv[1], t("scoreCurrentSceneId"));
                setText(scoreKv[2], t("scoreCurrentRole"));
                setText(scoreKv[3], t("scoreWrong"));
                setText(scoreKv[4], t("scoreProgress"));
            }

            // Refresh theme label in correct language

            const currentTheme = (root.getAttribute("data-theme") === "light") ? "light" : "dark";
            applyTheme(currentTheme);
        }

        function updateVolumeLabels()
        {
            if (bgVolPct && bgVol) setText(bgVolPct, `${bgVol.value}%`);
            if (fgVolPct && fgVol) setText(fgVolPct, `${fgVol.value}%`);
        }

        function setWarnings(lines, isWarn = true)
        {
            if (!warningsBox) return;
            if (!lines || !lines.length)
            {
                warningsBox.style.display = "none";
                warningsBox.textContent = "";
                warningsBox.classList.remove("warn");
                return;
            }
            warningsBox.style.display = "block";
            warningsBox.textContent = lines.join("\n");
            warningsBox.classList.toggle("warn", !!isWarn);
        }

        let isPaused = false;
        let pendingNav = null;
        let pauseSnapshot = null;

        let coverObjectUrl = null;

        let sceneObjectUrls = new Set();

        function trackSceneUrl(url)
        {
            if (url && String(url).startsWith("blob:")) sceneObjectUrls.add(url);
        }

        function revokeSceneObjectUrls()
        {
            for (const url of sceneObjectUrls)
            {
                if (!url) continue;
                if (coverObjectUrl && url === coverObjectUrl) continue;
                try
                {
                    URL.revokeObjectURL(url);
                }
                catch
                {}
            }
            sceneObjectUrls.clear();
        }

        function revokeCoverUrl()
        {
            try
            {
                if (coverObjectUrl && String(coverObjectUrl).startsWith("blob:")) URL.revokeObjectURL(coverObjectUrl);
            }
            catch
            {}
            coverObjectUrl = null;
        }

        function setCoverUrl(url, titleForAlt = "")
        {
            const next = url || null;

            if (coverObjectUrl && coverObjectUrl !== next)
            {
                try
                {
                    if (String(coverObjectUrl).startsWith("blob:")) URL.revokeObjectURL(coverObjectUrl);
                }
                catch
                {}
            }

            if (coverObjectUrl) sceneObjectUrls.delete(coverObjectUrl);
            if (next) sceneObjectUrls.delete(next);

            coverObjectUrl = next;

            if (!aboutCoverWrap || !aboutCover) return;

            if (!coverObjectUrl)
            {
                aboutCoverWrap.style.display = "none";
                aboutCover.removeAttribute("src");
                aboutCover.alt = "EGF cover";
                return;
            }

            const tAlt = String(titleForAlt || "").trim();
            aboutCover.src = coverObjectUrl;
            aboutCover.alt = tAlt ? `Cover: ${tAlt}` : "EGF cover";
            aboutCoverWrap.style.display = "flex";
        }

        function stopAndRevoke(el)
        {
            if (!el) return;
            try
            {
                el.pause();
            }
            catch
            {}
            try
            {
                if (el.src && el.src.startsWith("blob:")) URL.revokeObjectURL(el.src);
            }
            catch
            {}
            try
            {
                if (el.src && el.src.startsWith("blob:")) sceneObjectUrls.delete(el.src);
            }
            catch
            {}
        }

        const audioState = {
            bg: null,
            bgItemId: null,
            bgBaseVolume: 0.55,
            bgDuckVolume: 0.20,
            bgUserVolume: 1.0,
            bgPausedForPrimary: false,

            fgUserVolume: 1.0,

            fg: [],
            main: null,
            mainIsPrimary: false
        };

        function stopAllForegroundAudio()
        {
            for (const x of audioState.fg) stopAndRevoke(x.el);
            audioState.fg = [];
        }

        function stopMainMedia()
        {
            if (audioState.main) stopAndRevoke(audioState.main);
            audioState.main = null;
            audioState.mainIsPrimary = false;
        }

        function isAudioEl(el)
        {
            return !!el && (el instanceof HTMLAudioElement || el.tagName === "AUDIO");
        }

        function applyForegroundMuteIfNeeded()
        {
            const mute = !!fgMute?.checked;
            const mul = clamp01(audioState.fgUserVolume);

            for (const x of audioState.fg)
            {
                if (!x?.el) continue;
                const base = (x.baseVol ?? 1.0);
                x.el.volume = mute ? 0 : clamp01(base * mul);
            }

            if (audioState.main && isAudioEl(audioState.main))
            {
                audioState.main.volume = mute ? 0 : mul;
            }

            sceneWrap?.querySelectorAll("audio").forEach(a =>
            {
                try
                {
                    a.volume = mute ? 0 : mul;
                }
                catch
                {}
            });
        }

        function applyBgDuckIfNeeded()
        {
            const bg = audioState.bg;
            if (!bg) return;

            // If there's a global pause: the BG must stay stopped, period

            if (isPaused)
            {
                try
                {
                    bg.pause();
                }
                catch
                {}

                return;
            }

            const anyForegroundPlaying =
                (audioState.main && !audioState.main.paused) ||
                audioState.fg.some(x => x.el && !x.el.paused);

            if (bgMute?.checked)
            {
                bg.volume = 0;
                return;
            }

            // If the scene forces BG OFF, cut it immediately (even if autoplay blocks the "main")

            if (bgMode === "off")
            {
                try
                {
                    bg.volume = 0;
                }
                catch
                {}
                try
                {

                    // Mark as "suspended" so we can restart it later.

                    audioState.bgPausedForPrimary = true;
                    bg.pause();
                }
                catch
                {}
                return;
            }

            if (audioState.mainIsPrimary && audioState.main && !audioState.main.paused)
            {
                if (!bg.paused)
                {
                    audioState.bgPausedForPrimary = true;
                    bg.pause();
                }
                return;
            }

            if (audioState.bgPausedForPrimary && bg.paused)
            {
                audioState.bgPausedForPrimary = false;
                safePlay(bg);
            }

            const internal = anyForegroundPlaying ? audioState.bgDuckVolume : audioState.bgBaseVolume;
            bg.volume = clamp01(internal * clamp01(audioState.bgUserVolume));
        }

        function attachMainMedia(mediaEl,
        {
            primary
        } = {
            primary: false
        })
        {
            stopMainMedia();
            audioState.main = mediaEl;
            audioState.mainIsPrimary = !!primary;

            applyForegroundMuteIfNeeded();

            const onPlay = () =>
            {
                for (const x of audioState.fg)
                {
                    try
                    {
                        if (!x.el.paused) x.el.pause();
                    }
                    catch
                    {}
                }
                applyBgDuckIfNeeded();
            };

            const onPauseOrEnd = () =>
            {
                if (isPaused) return;

                for (const x of audioState.fg)
                {
                    try
                    {
                        if (x.el && x.el.currentTime < (x.el.duration || Infinity) && x.el.paused) x.el.play();
                    }
                    catch
                    {}
                }
                applyBgDuckIfNeeded();
            };

            mediaEl.addEventListener("play", onPlay);
            mediaEl.addEventListener("pause", onPauseOrEnd);
            mediaEl.addEventListener("ended", onPauseOrEnd);

            applyBgDuckIfNeeded();
        }

        function setSceneControlsDisabled(disabled)
        {
            const selectors = [
                '[data-egf="sceneContent"] button', '[data-egf="sceneContent"] input', '[data-egf="sceneContent"] select', '[data-egf="sceneContent"] textarea',
                '[data-egf="sceneFooter"] button', '[data-egf="sceneFooter"] input', '[data-egf="sceneFooter"] select', '[data-egf="sceneFooter"] textarea'
            ];
            for (const sel of selectors)
            {
                root.querySelectorAll(sel).forEach(el =>
                {
                    if (el === btnPause) return;
                    if (el === btnReset) return;
                    el.disabled = !!disabled;
                    if (el.classList.contains("choice")) el.setAttribute("aria-disabled", disabled ? "true" : "false");
                });
            }
        }

        function pauseAllMediaInDom()
        {
            sceneWrap?.querySelectorAll("audio, video").forEach(m =>
            {
                try
                {
                    m.pause();
                }
                catch
                {}
            });
        }

        async function resumeMediaFromSnapshot()
        {
            if (!pauseSnapshot) return;

            if (audioState.bg && pauseSnapshot.bgWasPlaying && !bgMute?.checked)
            {
                try
                {
                    await audioState.bg.play();
                }
                catch
                {}
            }
            if (audioState.main && pauseSnapshot.mainWasPlaying)
            {
                try
                {
                    await audioState.main.play();
                }
                catch
                {}
            }
            for (const x of audioState.fg)
            {
                const wasPlaying = pauseSnapshot.fgWasPlayingIds?.has(x.id);
                if (wasPlaying && x.el)
                {
                    try
                    {
                        await x.el.play();
                    }
                    catch
                    {}
                }
            }

            applyForegroundMuteIfNeeded();
            applyBgDuckIfNeeded();
        }

        async function setPaused(on)
        {
            if (!zip) return;
            if (on === isPaused) return;

            isPaused = on;

            if (isPaused)
            {
                pauseSnapshot = {
                    bgWasPlaying: !!(audioState.bg && !audioState.bg.paused),
                    mainWasPlaying: !!(audioState.main && !audioState.main.paused),
                    fgWasPlayingIds: new Set(audioState.fg.filter(x => x.el && !x.el.paused).map(x => x.id))
                };

                try
                {
                    audioState.bg?.pause();
                }
                catch
                {}
                try
                {
                    audioState.main?.pause();
                }
                catch
                {}
                for (const x of audioState.fg)
                {
                    try
                    {
                        x.el.pause();
                    }
                    catch
                    {}
                }

                pauseAllMediaInDom();
                setSceneControlsDisabled(true);

                root.classList.add("paused");
                if (btnPause) btnPause.classList.add("pauseOn");
                pauseOverlay?.setAttribute("aria-hidden", "false");
                applyLanguage(currentLang);

                return;
            }

            root.classList.remove("paused");
            if (btnPause) btnPause.classList.remove("pauseOn");
            pauseOverlay?.setAttribute("aria-hidden", "true");
            applyLanguage(currentLang);

            setSceneControlsDisabled(false);
            setNavButtons();

            await resumeMediaFromSnapshot();
            pauseSnapshot = null;

            if (pendingNav)
            {
                const p = pendingNav;
                pendingNav = null;
                if (p.type === "next") goNext();
                else if (p.type === "scene" && p.id) goToSceneId(p.id);
            }
        }

        function safeGoNext()
        {
            if (isPaused)
            {
                pendingNav = {
                    type: "next"
                };
                return;
            }
            goNext();
        }

        function safeGoToSceneId(id)
        {
            if (isPaused)
            {
                pendingNav = {
                    type: "scene",
                    id
                };
                return;
            }
            goToSceneId(id);
        }

        let zip = null;
        let corePath = null;
        let coreRootfileId = null;
        let coreDir = "";
        let egfVersion = "1.1";
        let manifestById = new Map();
        let settingsRefs = new Set();
        let settingsRefCounts = new Map();
        let sequence = [];
        let sceneIndexById = new Map();

        let meta = {
            title: "—",
            creator: "—",
            description: "—",
            date: "—",
            modified: "—"
        };

        const gameState = {
            currentIndex: 0,
            sessionActive: false,
            wrongCount: 0,
            maxWrong: 5,
            idGameTitle: null,
            idCongratulations: null,
            idGameOver: null,
            idCredits: null,
            bgItems: [],
            fgItemsBySceneId: new Map(),
            coverItem: null,

            gameplayStartIdx: 0,
            gameplayEndIdx: 0,
            lastGameplayPct: 0
        };

        function posixNormalize(path)
        {
            const parts = path.split("/").filter(p => p.length > 0);
            const out = [];
            for (const p of parts)
            {
                if (p === ".") continue;
                if (p === "..")
                {
                    out.pop();
                    continue;
                }
                out.push(p);
            }
            return out.join("/");
        }

        function resolveRelative(baseDir, href)
        {
            if (!href) return null;
            if (href.startsWith("/")) throw new Error(`Invalid href: absolute paths are not allowed (href="${href}"). Use a relative path.`);
            if (href.includes("\\")) throw new Error(`Invalid href: backslashes are not allowed (href="${href}"). Use "/" separators.`);
            const joined = (baseDir ? (baseDir.replace(/\/?$/, "/")) : "") + href;
            const norm = posixNormalize(joined);
            if (!norm || norm === ".") throw new Error(`Invalid href: resolves to an empty path (href="${href}").`);
            if (norm.split("/").some(seg => seg === "..")) throw new Error(`Invalid href: path traversal is not allowed (href="${href}").`);
            return norm;
        }

        function dirname(path)
        {
            const i = path.lastIndexOf("/");
            return i >= 0 ? path.slice(0, i + 1) : "";
        }

        async function readZipText(path)
        {
            const f = zip.file(path);
            if (!f) throw new Error(`Missing file in ZIP: ${path}`);
            return await f.async("string");
        }

        async function readZipBlobUrl(path, mimeType)
        {
            const f = zip.file(path);
            if (!f) throw new Error(`Missing file in ZIP: ${path}`);
            const blob = await f.async("blob");
            const b = mimeType ? new Blob([blob],
            {
                type: mimeType
            }) : blob;
            const url = URL.createObjectURL(b);
            trackSceneUrl(url);
            return url;
        }

        function parseXml(xmlText)
        {
            const parser = new DOMParser();
            const doc = parser.parseFromString(xmlText, "application/xml");
            const err = doc.querySelector("parsererror");
            if (err) throw new Error("Invalid XML: " + err.textContent.slice(0, 200));
            return doc;
        }

        function getAttr(el, name)
        {
            const v = el.getAttribute(name);
            return v == null ? null : v;
        }

        function getTextDirect(el)
        {
            const t0 = (el.textContent || "").trim();
            return t0.length ? t0 : "";
        }

        function parseItemElement(el, baseDirForHref)
        {
            const role = getAttr(el, "role") || "";
            const id = getAttr(el, "id") || null;
            const mediaType = getAttr(el, "media-type") || null;
            const hrefRaw = getAttr(el, "href");
            const hrefPath = hrefRaw ? resolveRelative(baseDirForHref, hrefRaw) : null;

            const value = getAttr(el, "value");
            const caseSensitive = getAttr(el, "case-sensitive");
            const diacriticSensitive = getAttr(el, "diacritic-sensitive");
            const sceneRef = getAttr(el, "scene-ref");
            const enableNextAtStart = getAttr(el, "enable-next-button-at-start");

            const inlineText = hrefPath ? "" : getTextDirect(el);

            const childEls = Array.from(el.children).filter(c => c.tagName === "item");
            const children = childEls.map(c => parseItemElement(c, baseDirForHref));

            return {
                role,
                id,
                mediaType,
                hrefPath,
                hrefRaw,
                value,
                caseSensitive,
                diacriticSensitive,
                sceneRef,
                enableNextAtStart,
                inlineText,
                children
            };
        }

        // MIME rules

        const ROLE_MIME_RULES_MANIFEST = {
            text_simple: ["text/plain"],
            image_simple: ["image/png", "image/jpeg"],
            audio_simple: ["audio/wav", "audio/ogg", "audio/mpeg"],
            video_simple: ["video/mp4", "video/webm"],

            background_audio: ["audio/wav", "audio/ogg", "audio/mpeg"],
            foreground_audio: ["audio/wav", "audio/ogg", "audio/mpeg"],
            egf_cover: ["image/png", "image/jpeg"],

            mcq_simple: ["application/xml"],
            hangman_simple: ["application/xml"],
            question_simple: ["application/xml"],
            true_or_false_simple: ["application/xml"],
            game_title_simple: ["application/xml"],
            congratulations_simple: ["application/xml"],
            game_over_simple: ["application/xml"],
            credits_simple: ["application/xml"],
        };

        function allowedMimesForSceneItemRole(role)
        {
            const r = String(role || "");
            if (r === "correct_answer" || r === "answer_to_guess") return null;
            if (/^hangman_status_0[1-9]$/i.test(r)) return ["image/png", "image/jpeg"];
            if (r.endsWith("_text") || r === "question_text") return ["text/plain"];
            if (r.endsWith("_image") || r.includes("_image")) return ["image/png", "image/jpeg"];
            if (r.endsWith("_audio") || r.includes("_audio")) return ["audio/wav", "audio/ogg", "audio/mpeg"];
            if (r.endsWith("_video") || r.includes("_video")) return ["video/mp4", "video/webm"];
            return null;
        }

        function assertAllowedMediaType(
        {
            role,
            mediaType,
            allowed,
            context
        })
        {
            if (!allowed) return;
            const mt = (mediaType || "").trim();
            if (!mt) throw new Error(`Invalid EGF: missing required media-type for role "${role}" (${context}). Allowed: ${allowed.join(", ")}`);
            if (!allowed.includes(mt)) throw new Error(`Invalid EGF: media-type "${mt}" is not allowed for role "${role}" (${context}). Allowed: ${allowed.join(", ")}`);
        }

        // ZIP strict check helpers

        function readU16LE(dv, o)
        {
            return dv.getUint16(o, true);
        }

        function readU32LE(dv, o)
        {
            return dv.getUint32(o, true);
        }

        function readAscii(bytes)
        {
            let s = "";
            for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
            return s;
        }

        function findFirstLocalFileHeaderOffset(dv)
        {
            const SIG_LFH = 0x04034b50;
            const n = dv.byteLength;
            for (let i = 0; i + 3 < n; i++)
                if (readU32LE(dv, i) === SIG_LFH) return i;
            return -1;
        }

        function validateMimetypeFirstOrThrow(arrayBuffer)
        {
            const dv = new DataView(arrayBuffer);
            const bytes = new Uint8Array(arrayBuffer);

            const off = findFirstLocalFileHeaderOffset(dv);
            if (off < 0 || dv.byteLength < off + 30) throw new Error("Invalid EGF package: could not locate a ZIP Local File Header.");

            const compression = readU16LE(dv, off + 8);
            const nameLen = readU16LE(dv, off + 26);
            const nameStart = off + 30;
            const nameEnd = nameStart + nameLen;
            if (nameEnd > dv.byteLength) throw new Error("Invalid ZIP: first entry filename exceeds file size.");

            const fileName = readAscii(bytes.slice(nameStart, nameEnd));
            if (fileName !== "mimetype") throw new Error(`Invalid EGF package: first ZIP entry must be "mimetype" (found "${fileName || "(empty)"}").`);
            if (compression !== 0) throw new Error(`Invalid EGF package: "mimetype" must be stored (compression method 0). Found=${compression}.`);
        }

        async function validateMimetypeOrThrow(z)
        {
            const f = z.file("mimetype");
            if (!f) throw new Error('Invalid EGF package: missing required file "mimetype" at ZIP root.');
            const bytes = await f.async("uint8array");
            const text = new TextDecoder("utf-8",
            {
                fatal: true
            }).decode(bytes);
            const expected = "application/egf+zip";
            if (text !== expected)
            {
                const shown = text.replace(/\r/g, "\\r").replace(/\n/g, "\\n").replace(/\t/g, "\\t");
                throw new Error(`Invalid EGF package: file "mimetype" must contain exactly: "${expected}". Got: "${shown}".`);
            }
        }

        function assertSafeZipRelativePath(p,
        {
            label = "path"
        } = {})
        {
            if (p == null) throw new Error(`Invalid ${label}: missing value.`);
            const raw = String(p).trim();
            if (!raw) throw new Error(`Invalid ${label}: empty.`);
            if (raw.startsWith("/")) throw new Error(`Invalid ${label}: must be a relative path from ZIP root.`);
            if (raw.includes("\\")) throw new Error(`Invalid ${label}: backslashes are not allowed (use "/" separators).`);
            const parts = raw.split("/");
            for (const seg of parts)
                if (seg === "..") throw new Error(`Invalid ${label}: path traversal ("..") is not allowed.`);
            const norm = posixNormalize(raw);
            if (!norm || norm === ".") throw new Error(`Invalid ${label}: resolves to an empty path.`);
            return norm;
        }

        async function locateCoreFile(z)
        {
            const containerPath = "META-INF/container.xml";
            const containerFile = z.file(containerPath);
            if (!containerFile) throw new Error(`Invalid EGF package: missing required file "${containerPath}".`);

            const xmlText = await containerFile.async("string");
            const doc = parseXml(xmlText);

            const containerEl = doc.documentElement;
            if (!containerEl || containerEl.localName !== "container") throw new Error(`Invalid EGF package: "${containerPath}" root must be <container>.`);

            const ver = (containerEl.getAttribute("version") || "").trim();
            if (ver !== "1.0") throw new Error(`Invalid EGF package: "${containerPath}" <container> must have version="1.0".`);

            const rootfilesEl = Array.from(containerEl.children).find(n => n.localName === "rootfiles");
            if (!rootfilesEl) throw new Error(`Invalid EGF package: "${containerPath}" missing <rootfiles>.`);

            const rootfileEls = Array.from(rootfilesEl.children).filter(n => n.localName === "rootfile");
            if (rootfileEls.length !== 1) throw new Error(`Invalid EGF package: "${containerPath}" must contain exactly one <rootfile>.`);

            const rootfile = rootfileEls[0];

            const fullPathRaw = (rootfile.getAttribute("full-path") || "").trim();
            if (!fullPathRaw) throw new Error(`Invalid EGF package: <rootfile> missing "full-path".`);

            const idRaw = (rootfile.getAttribute("id") || "").trim();
            if (!idRaw) throw new Error(`Invalid EGF package: <rootfile> missing "id".`);
            if (/\s/.test(idRaw)) throw new Error(`Invalid EGF package: <rootfile> "id" must not contain whitespace.`);

            const fullPath = assertSafeZipRelativePath(fullPathRaw,
            {
                label: "rootfile full-path"
            });
            if (!z.file(fullPath)) throw new Error(`Invalid EGF package: core file not found at "${fullPath}".`);

            coreRootfileId = idRaw;
            return fullPath;
        }

        function parseMetadata(coreDoc)
        {
            const md = coreDoc.querySelector("metadata");
            let title = "—",
                creator = "—",
                description = "—",
                date = "—",
                modified = "—";

            if (md)
            {
                const titleEl = md.getElementsByTagName("dc:title")[0] || md.getElementsByTagName("title")[0];
                if (titleEl && titleEl.textContent.trim()) title = titleEl.textContent.trim();

                const creatorEl = md.getElementsByTagName("dc:creator")[0] || md.getElementsByTagName("creator")[0];
                if (creatorEl && creatorEl.textContent.trim()) creator = creatorEl.textContent.trim();

                const descEl = md.getElementsByTagName("dc:description")[0] || md.getElementsByTagName("description")[0];
                if (descEl && descEl.textContent.trim()) description = descEl.textContent.trim();

                const dateEl = md.getElementsByTagName("dc:date")[0] || md.getElementsByTagName("date")[0];
                if (dateEl && dateEl.textContent.trim()) date = dateEl.textContent.trim();

                const modifiedEl = md.querySelector('meta[property="dcterms:modified"]');
                if (modifiedEl)
                {
                    const v = (modifiedEl.getAttribute("content") || modifiedEl.textContent || "").trim();
                    if (v) modified = v;
                }
            }

            meta = {
                title,
                creator,
                description,
                date,
                modified
            };
        }

        function updateHeaderIdentity()
        {
            setText(sceneName, (meta?.title && meta.title !== "—") ? meta.title : "—");
            const creator = (meta?.creator && meta.creator !== "—") ? meta.creator : "—";
            setText(sceneSub, t("createdBy",
            {
                name: creator
            }));
        }

        function updateAboutUi()
        {
            if (kvVer) setText(kvVer, egfVersion || "—");
            if (kvTitle) setText(kvTitle, meta.title || "—");
            if (kvCreator) setText(kvCreator, meta.creator || "—");
            if (kvDesc) setText(kvDesc, meta.description || "—");
            if (kvDate) setText(kvDate, meta.date || "—");
            if (kvModified) setText(kvModified, meta.modified || "—");

            if (kvWrong) setText(kvWrong, `${gameState.wrongCount} / ${gameState.maxWrong}`);

            if (kvCurrentScene)
            {
                const idx = (gameState.currentIndex ?? 0);
                const total = (sequence?.length ?? 0);
                setText(kvCurrentScene, total ? `${idx + 1} / ${total}` : "—");
            }

            if (kvCurrentSceneId)
            {
                const sceneId = sequence?.[gameState.currentIndex];
                setText(kvCurrentSceneId, sceneId || "—");
            }

            if (kvCurrentRole)
            {
                const sceneId = sequence?.[gameState.currentIndex];
                const it = sceneId ? manifestById.get(sceneId) : null;
                setText(kvCurrentRole, it?.role || "—");
            }
        }

        function setProgressUI(box, textEl, fillEl, show, pct)
        {
            if (!box || !textEl || !fillEl) return;
            box.style.display = show ? "flex" : "none";
            if (!show) return;
            setText(textEl, `${Math.round(pct)}%`);
            fillEl.style.width = `${pct}%`;
        }

        function computeGameplayPctForIndex(idx)
        {
            const start = gameState.gameplayStartIdx ?? 0;
            const end = gameState.gameplayEndIdx ?? 0;

            if (idx < start) return 0;

            if (idx <= end)
            {
                if (end <= start) return (idx >= end) ? 100 : 0;
                if (idx >= end) return 100;
                const denom = (end - start);
                const pct = ((idx - start) / denom) * 100;
                return Math.max(0, Math.min(100, pct));
            }
            return Math.max(0, Math.min(100, gameState.lastGameplayPct ?? 0));
        }

        function syncScoreProgressGradient()
        {
            if (!scoreProgressPct) return;

            const src = roleBarFill || barFill;
            if (!src) return;

            const cs = window.getComputedStyle(src);
            const bg = cs.backgroundImage;

            if (!bg || bg === "none") return;

            // Apply the gradient to the text

            scoreProgressPct.style.backgroundImage = bg;
            scoreProgressPct.style.backgroundRepeat = "no-repeat";
            scoreProgressPct.style.backgroundSize = "100% 100%";

            scoreProgressPct.style.webkitBackgroundClip = "text";
            scoreProgressPct.style.backgroundClip = "text";
            scoreProgressPct.style.color = "transparent";
            scoreProgressPct.style.webkitTextFillColor = "transparent"; // Safari
        }

        function updateProgressUi()
        {
            // No game loaded

            if (!zip || !sequence?.length)
            {
                setProgressUI(progressBox, progressText, barFill, false, 0);
                setProgressUI(rolePill, roleProgressText, roleBarFill, false, 0);

                if (scoreProgressPct)
                {
                    scoreProgressPct.textContent = "—";
                    syncScoreProgressGradient();
                }
                return;
            }

            const idx = gameState.currentIndex ?? 0;
            const start = gameState.gameplayStartIdx ?? 0;

            // Before gameplay starts

            if (idx < start)
            {
                setProgressUI(progressBox, progressText, barFill, false, 0);
                setProgressUI(rolePill, roleProgressText, roleBarFill, false, 0);

                if (scoreProgressPct)
                {
                    scoreProgressPct.textContent = "0%";
                    syncScoreProgressGradient();
                }
                return;
            }

            // Calculation

            const pct = computeGameplayPctForIndex(idx);

            // Memory

            if (idx <= (gameState.gameplayEndIdx ?? idx))
            {
                gameState.lastGameplayPct = pct;
            }

            // Game bars

            setProgressUI(progressBox, progressText, barFill, true, pct);
            setProgressUI(rolePill, roleProgressText, roleBarFill, true, pct);

            // Score modal: text only

            if (scoreProgressPct)
            {
                scoreProgressPct.textContent = `${Math.round(pct)}%`;
                syncScoreProgressGradient();
            }
        }

        function setNavButtons()
        {
            const hasZip = !!zip;
            if (btnReset) btnReset.disabled = !hasZip;
            if (btnPause) btnPause.disabled = !hasZip;
            if (btnScore) btnScore.disabled = !hasZip;
        }

        function showFatal(err)
        {
            console.error(err);
            setHtml(sceneContent, `<div class="notice warn"><b>${escapeHtml(String(err.message || err))}</b><br><br><span class="muted">See the console for details.</span></div>`);
            setHtml(sceneFooter, "");
            setText(sceneName, t("error"));
            setText(sceneSub, t("cannotRender"));
        }

        function normalizeAnswer(str,
        {
            caseSensitive,
            diacriticSensitive
        })
        {
            let s = String(str ?? "");
            if (!caseSensitive) s = s.toLocaleLowerCase("und");
            if (!diacriticSensitive)
            {
                try
                {
                    s = s.normalize("NFD").replace(/\p{M}/gu, "");
                }
                catch
                {
                    s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                }
            }
            return s;
        }

        function shouldOverrideToGameOver()
        {
            if (!gameState.sessionActive) return false;
            if (!gameState.idGameOver) return false;
            return gameState.wrongCount >= gameState.maxWrong;
        }

        function lockGameplayProgressAtCurrentScene()
        {
            const pct = computeGameplayPctForIndex(gameState.currentIndex);
            gameState.lastGameplayPct = pct;
        }

        function goToSceneIndex(idx)
        {
            if (!zip) return;
            gameState.currentIndex = Math.max(0, Math.min(sequence.length - 1, idx));
            renderCurrentScene().catch(showFatal);
            setNavButtons();
            updateProgressUi();
        }

        function goToSceneId(sceneId)
        {
            const idx = sceneIndexById.get(sceneId);
            if (idx == null) return;
            goToSceneIndex(idx);
        }

        function goNext()
        {
            const idx = gameState.currentIndex + 1;
            if (idx < sequence.length) goToSceneIndex(idx);
        }

        function computeDefaultGameplayScope()
        {
            const idxTitle = sceneIndexById.get(gameState.idGameTitle) ?? 0;
            const idxCongrats = sceneIndexById.get(gameState.idCongratulations) ?? (sequence.length - 3);
            const fromIdx = Math.min(idxTitle + 1, sequence.length - 1);
            const toIdx = Math.max(fromIdx, idxCongrats - 1);
            const scopeFromId = sequence[fromIdx] ?? null;
            const scopeToId = sequence[toIdx] ?? null;
            return {
                scopeFromId,
                scopeToId,
                fromIdx,
                toIdx
            };
        }

        function buildAudioSettings()
        {
            gameState.bgItems = [];
            gameState.fgItemsBySceneId = new Map();

            for (const [id, it] of manifestById.entries())
            {
                if (it.role === "background_audio" && settingsRefs.has(id))
                {
                    let scopeFromId = it.scopeFromId ?? it.scopeFrom ?? it["scope-from"] ?? it.scope_from ?? null;
                    let scopeToId = it.scopeToId ?? it.scopeTo ?? it["scope-to"] ?? it.scope_to ?? null;

                    if (!scopeFromId || !scopeToId)
                    {
                        const d = computeDefaultGameplayScope();
                        scopeFromId = d.scopeFromId;
                        scopeToId = d.scopeToId;
                    }

                    const scopeFromIdx = sceneIndexById.get(scopeFromId);
                    const scopeToIdx = sceneIndexById.get(scopeToId);

                    gameState.bgItems.push(
                    {
                        id,
                        hrefPath: it.hrefPath,
                        mediaType: it.mediaType,
                        scopeFromId,
                        scopeToId,
                        scopeFromIdx: scopeFromIdx ?? 0,
                        scopeToIdx: scopeToIdx ?? (sequence.length - 1),
                    });
                }
            }

            for (const [id, it] of manifestById.entries())
            {
                if (it.role === "foreground_audio" && settingsRefs.has(id))
                {
                    const sceneRef = it.sceneRef || it["scene-ref"] || it.scene_ref || null;
                    if (!sceneRef) continue;
                    const list = gameState.fgItemsBySceneId.get(sceneRef) || [];
                    list.push(
                    {
                        id,
                        hrefPath: it.hrefPath,
                        mediaType: it.mediaType
                    });
                    gameState.fgItemsBySceneId.set(sceneRef, list);
                }
            }
        }

        function pickBgItemForIndex(sceneIdx)
        {
            const candidates = gameState.bgItems.filter(x => sceneIdx >= x.scopeFromIdx && sceneIdx <= x.scopeToIdx);
            if (!candidates.length) return null;
            candidates.sort((a, b) => (b.scopeFromIdx - a.scopeFromIdx));
            return candidates[0];
        }

        async function ensureBackgroundAudioForScene(sceneIdx)
        {
            // BG OFF policy: don't start any background audio on this scene

            if (bgMode === "off")
            {
                if (audioState.bg)
                {
                    try
                    {
                        audioState.bg.volume = 0;
                    }
                    catch
                    {}
                    try
                    {
                        audioState.bgPausedForPrimary = true;
                        audioState.bg.pause();
                    }
                    catch
                    {}
                }
                return;
            }

            const chosen = pickBgItemForIndex(sceneIdx);

            if (!chosen)
            {
                if (audioState.bg)
                {
                    stopAndRevoke(audioState.bg);
                    audioState.bg = null;
                    audioState.bgItemId = null;
                }
                return;
            }

            if (audioState.bgItemId === chosen.id && audioState.bg)
            {
                applyBgDuckIfNeeded();
                return;
            }

            if (audioState.bg) stopAndRevoke(audioState.bg);

            audioState.bg = new Audio();
            audioState.bg.loop = true;
            audioState.bgItemId = chosen.id;

            const url = await readZipBlobUrl(chosen.hrefPath, chosen.mediaType);
            audioState.bg.src = url;

            applyBgDuckIfNeeded();
            if (!isPaused) await safePlay(audioState.bg);
            applyBgDuckIfNeeded();
        }

        async function playForegroundAudioForScene(sceneId)
        {
            stopAllForegroundAudio();
            const list = gameState.fgItemsBySceneId.get(sceneId) || [];

            for (const item of list)
            {
                const el = new Audio();
                const url = await readZipBlobUrl(item.hrefPath, item.mediaType);
                el.src = url;

                const baseVol = 1.0;
                el.volume = fgMute?.checked ? 0 : clamp01(baseVol * clamp01(audioState.fgUserVolume));

                audioState.fg.push(
                {
                    id: item.id,
                    el,
                    baseVol
                });

                try
                {
                    if (!isPaused) await el.play();
                }
                catch
                {}

                el.addEventListener("play", applyBgDuckIfNeeded);
                el.addEventListener("pause", applyBgDuckIfNeeded);
                el.addEventListener("ended", applyBgDuckIfNeeded);
            }

            applyForegroundMuteIfNeeded();
            applyBgDuckIfNeeded();
        }

        function validateSceneRootOrThrow(doc, expectedRootTag, scenePath)
        {
            const rootEl = doc?.documentElement;
            if (!rootEl || rootEl.tagName !== expectedRootTag)
            {
                throw new Error(`Invalid ${expectedRootTag} scene (${scenePath}): root element MUST be <${expectedRootTag}> (found <${rootEl?.tagName || "?"}>).`);
            }
        }

        function roleCount(items, role)
        {
            return items.filter(it => it.role === role).length;
        }

        function findByRole(items, role)
        {
            return items.find(it => it.role === role) || null;
        }

        function requireHrefAndAllowedMimeOrThrow(item, allowedMimes, label, scenePath)
        {
            if (!item) throw new Error(`Invalid scene (${scenePath}): missing required item "${label}".`);
            if (!item.hrefPath) throw new Error(`Invalid scene (${scenePath}): "${label}" MUST reference an external resource via href.`);
            const mt = String(item.mediaType || "").trim();
            if (!mt) throw new Error(`Invalid scene (${scenePath}): "${label}" MUST have a media-type attribute.`);
            if (!allowedMimes.includes(mt))
            {
                throw new Error(`Invalid scene (${scenePath}): "${label}" media-type "${mt}" is not allowed. Allowed: ${allowedMimes.join(", ")}.`);
            }
        }

        function forbidExtraRolesOrThrow(items, allowedRoles, scenePath, sceneRole)
        {
            const allowed = new Set(allowedRoles);
            const extras = items.map(it => it.role).filter(r => r && !allowed.has(r));
            if (extras.length)
            {
                throw new Error(`Invalid ${sceneRole} scene (${scenePath}): contains unexpected item role(s): ${extras.map(x => `"${x}"`).join(", ")}.`);
            }
        }

        function validateGameTitleSimpleSceneOrThrow(items, scenePath)
        {
            const errors = [];
            const allowedRoles = ["game_title_image", "game_title_audio"];
            try
            {
                forbidExtraRolesOrThrow(items, allowedRoles, scenePath, "game_title_simple");
            }
            catch (e)
            {
                errors.push(e.message);
            }
            if (items.length !== 2) errors.push(`game_title_simple MUST contain exactly 2 <item> elements (found ${items.length}).`);
            if (roleCount(items, "game_title_image") !== 1) errors.push(`game_title_simple MUST contain exactly 1 game_title_image.`);
            if (roleCount(items, "game_title_audio") !== 1) errors.push(`game_title_simple MUST contain exactly 1 game_title_audio.`);
            if (errors.length) throw new Error(`Invalid game_title_simple scene (${scenePath}):\n` + errors.map(e => "• " + e).join("\n"));
            requireHrefAndAllowedMimeOrThrow(findByRole(items, "game_title_image"), ["image/png", "image/jpeg"], "game_title_image", scenePath);
            requireHrefAndAllowedMimeOrThrow(findByRole(items, "game_title_audio"), ["audio/wav", "audio/ogg", "audio/mpeg"], "game_title_audio", scenePath);
        }

        function validateCongratulationsSimpleSceneOrThrow(items, scenePath)
        {
            const errors = [];
            const allowedRoles = ["congratulations_image", "congratulations_audio"];
            try
            {
                forbidExtraRolesOrThrow(items, allowedRoles, scenePath, "congratulations_simple");
            }
            catch (e)
            {
                errors.push(e.message);
            }
            if (items.length !== 2) errors.push(`congratulations_simple MUST contain exactly 2 <item> elements (found ${items.length}).`);
            if (roleCount(items, "congratulations_image") !== 1) errors.push(`congratulations_simple MUST contain exactly 1 congratulations_image.`);
            if (roleCount(items, "congratulations_audio") !== 1) errors.push(`congratulations_simple MUST contain exactly 1 congratulations_audio.`);
            if (errors.length) throw new Error(`Invalid congratulations_simple scene (${scenePath}):\n` + errors.map(e => "• " + e).join("\n"));
            requireHrefAndAllowedMimeOrThrow(findByRole(items, "congratulations_image"), ["image/png", "image/jpeg"], "congratulations_image", scenePath);
            requireHrefAndAllowedMimeOrThrow(findByRole(items, "congratulations_audio"), ["audio/wav", "audio/ogg", "audio/mpeg"], "congratulations_audio", scenePath);
        }

        function validateGameOverSimpleSceneOrThrow(items, scenePath)
        {
            const errors = [];
            const allowedRoles = ["game_over_image", "game_over_audio"];
            try
            {
                forbidExtraRolesOrThrow(items, allowedRoles, scenePath, "game_over_simple");
            }
            catch (e)
            {
                errors.push(e.message);
            }
            if (items.length !== 2) errors.push(`game_over_simple MUST contain exactly 2 <item> elements (found ${items.length}).`);
            if (roleCount(items, "game_over_image") !== 1) errors.push(`game_over_simple MUST contain exactly 1 game_over_image.`);
            if (roleCount(items, "game_over_audio") !== 1) errors.push(`game_over_simple MUST contain exactly 1 game_over_audio.`);
            if (errors.length) throw new Error(`Invalid game_over_simple scene (${scenePath}):\n` + errors.map(e => "• " + e).join("\n"));
            requireHrefAndAllowedMimeOrThrow(findByRole(items, "game_over_image"), ["image/png", "image/jpeg"], "game_over_image", scenePath);
            requireHrefAndAllowedMimeOrThrow(findByRole(items, "game_over_audio"), ["audio/wav", "audio/ogg", "audio/mpeg"], "game_over_audio", scenePath);
        }

        function validateCreditsSimpleSceneOrThrow(items, scenePath)
        {
            const errors = [];
            const fields = items.filter(it => it.role === "credit_field");
            if (fields.length < 1) errors.push(`credits_simple MUST contain at least 1 credit_field item.`);
            for (let i = 0; i < fields.length; i++)
            {
                const f = fields[i];
                const label = f.children?.find(x => x.role === "label")?.inlineText?.trim() || "";
                const content = f.children?.find(x => x.role === "content")?.inlineText?.trim() || "";
                if (!label) errors.push(`credits_simple credit_field[${i}] is missing child <item role="label">...</item>.`);
                if (!content) errors.push(`credits_simple credit_field[${i}] is missing child <item role="content">...</item>.`);
            }
            if (errors.length) throw new Error(`Invalid credits_simple scene (${scenePath}):\n` + errors.map(e => "• " + e).join("\n"));
        }

        function validateMcqSimpleSceneOrThrow(items, scenePath)
        {
            const errors = [];
            if (items.length !== 7) errors.push(`mcq_simple scene MUST contain exactly 7 <item> elements (found ${items.length}).`);
            const questionRoles = new Set(["mcq_question_text", "mcq_question_image", "mcq_question_audio", "mcq_question_video"]);
            const questions = items.filter(it => questionRoles.has(it.role));
            const goodAnswers = items.filter(it => it.role?.startsWith("good_answer_"));
            const badAnswers = items.filter(it => it.role?.startsWith("wrong_answer_"));
            const goodFb = items.filter(it => it.role === "mcq_good_answer_feedback_audio");
            const badFb = items.filter(it => it.role === "mcq_wrong_answer_feedback_audio");
            if (questions.length !== 1) errors.push(`mcq_simple MUST contain exactly 1 question item.`);
            if (goodAnswers.length !== 1) errors.push(`mcq_simple MUST contain exactly 1 good_answer_* item.`);
            if (badAnswers.length !== 3) errors.push(`mcq_simple MUST contain exactly 3 wrong_answer_* items.`);
            if (goodFb.length !== 1) errors.push(`mcq_simple MUST contain exactly 1 mcq_good_answer_feedback_audio.`);
            if (badFb.length !== 1) errors.push(`mcq_simple MUST contain exactly 1 mcq_wrong_answer_feedback_audio.`);
            if (errors.length) throw new Error(`Invalid mcq_simple scene (${scenePath}):\n` + errors.map(e => "• " + e).join("\n"));
        }

        function validateTrueOrFalseSimpleSceneOrThrow(items, scenePath)
        {
            const errors = [];
            const questionRoles = new Set(["question_text", "question_image", "question_audio", "question_video"]);
            const questions = items.filter(it => questionRoles.has(it.role));
            const goodFb = items.filter(it => it.role === "good_answer_feedback_audio");
            const badFb = items.filter(it => it.role === "wrong_answer_feedback_audio");
            const correct = items.filter(it => it.role === "correct_answer");
            if (questions.length !== 1) errors.push(`true_or_false_simple MUST contain exactly 1 question_* item.`);
            if (goodFb.length !== 1) errors.push(`true_or_false_simple MUST contain exactly 1 good_answer_feedback_audio.`);
            if (badFb.length !== 1) errors.push(`true_or_false_simple MUST contain exactly 1 wrong_answer_feedback_audio.`);
            if (correct.length !== 1) errors.push(`true_or_false_simple MUST contain exactly 1 correct_answer item (value="true|false").`);
            if (items.length !== 4) errors.push(`true_or_false_simple MUST contain exactly 4 <item> elements (found ${items.length}).`);
            const v = String(correct?.[0]?.value || "").trim();
            if (v !== "true" && v !== "false") errors.push(`true_or_false_simple correct_answer value MUST be "true" or "false" (got "${v || "empty"}").`);
            if (errors.length) throw new Error(`Invalid true_or_false_simple scene (${scenePath}):\n` + errors.map(e => "• " + e).join("\n"));
        }

        function validateQuestionSimpleSceneOrThrow(items, scenePath)
        {
            const errors = [];
            const questionRoles = new Set(["question_text", "question_image", "question_audio", "question_video"]);
            const questions = items.filter(it => questionRoles.has(it.role));
            const goodFb = items.filter(it => it.role === "good_answer_feedback_audio");
            const badFb = items.filter(it => it.role === "wrong_answer_feedback_audio");
            const answer = items.filter(it => it.role === "answer_to_guess");
            if (questions.length !== 1) errors.push(`question_simple MUST contain exactly 1 question_* item.`);
            if (goodFb.length !== 1) errors.push(`question_simple MUST contain exactly 1 good_answer_feedback_audio.`);
            if (badFb.length !== 1) errors.push(`question_simple MUST contain exactly 1 wrong_answer_feedback_audio.`);
            if (answer.length !== 1) errors.push(`question_simple MUST contain exactly 1 answer_to_guess item (value="...").`);
            if (items.length !== 4) errors.push(`question_simple MUST contain exactly 4 <item> elements (found ${items.length}).`);
            const v = String(answer?.[0]?.value ?? "").trim();
            if (!v) errors.push(`question_simple answer_to_guess MUST have a non-empty value attribute.`);
            if (errors.length) throw new Error(`Invalid question_simple scene (${scenePath}):\n` + errors.map(e => "• " + e).join("\n"));
        }

        function validateHangmanSimpleSceneOrThrow(items, scenePath)
        {
            const errors = [];
            if (items.length !== 12) errors.push(`hangman_simple MUST contain exactly 12 <item> elements (found ${items.length}).`);

            const counts = new Map();
            for (const it of items)
            {
                const role = String(it?.role || "");
                if (!role) continue;
                counts.set(role, (counts.get(role) || 0) + 1);
            }

            const requiredStatusRoles = Array.from(
            {
                length: 9
            }, (_, i) => `hangman_status_${String(i + 1).padStart(2,"0")}`);
            const requiredRoles = [...requiredStatusRoles, "good_answer_audio", "wrong_answer_audio", "answer_to_guess"];

            for (const role of requiredRoles)
            {
                if (!counts.has(role)) errors.push(`hangman_simple is missing required item role="${role}".`);
                else if (counts.get(role) !== 1) errors.push(`hangman_simple MUST contain exactly 1 item role="${role}" (found ${counts.get(role)}).`);
            }

            for (const role of counts.keys())
            {
                if (!requiredRoles.includes(role)) errors.push(`hangman_simple MUST NOT contain extra item role="${role}" (EGF 1.1 requires exactly the 12 roles).`);
            }

            const IMG_ALLOWED = ["image/png", "image/jpeg"];
            const AUD_ALLOWED = ["audio/wav", "audio/ogg", "audio/mpeg"];

            function mustHaveHrefAndMedia(it, allowed, label)
            {
                if (!it) return;
                if (!it.hrefPath) errors.push(`${label} MUST have an href attribute (external resource).`);
                const mt = String(it.mediaType || "").trim();
                if (!mt) errors.push(`${label} MUST have a media-type attribute.`);
                else if (!allowed.includes(mt)) errors.push(`${label} media-type "${mt}" is not allowed. Allowed: ${allowed.join(", ")}.`);
            }

            for (const role of requiredStatusRoles) mustHaveHrefAndMedia(items.find(x => x.role === role), IMG_ALLOWED, role);
            mustHaveHrefAndMedia(items.find(x => x.role === "good_answer_audio"), AUD_ALLOWED, "good_answer_audio");
            mustHaveHrefAndMedia(items.find(x => x.role === "wrong_answer_audio"), AUD_ALLOWED, "wrong_answer_audio");

            const ans = items.find(x => x.role === "answer_to_guess");
            if (ans)
            {
                const v = String(ans.value ?? "").trim();
                if (!v) errors.push(`answer_to_guess MUST have a non-empty value attribute.`);

                const cs = (ans.caseSensitive ?? ans["case-sensitive"]);
                const csNorm = String(cs ?? "").trim().toLowerCase();
                if (csNorm !== "true" && csNorm !== "false") errors.push(`answer_to_guess MUST have case-sensitive="true|false" (got "${String(cs ?? "").trim() || "missing"}").`);

                const ds = (ans.diacriticSensitive ?? ans["diacritic-sensitive"]);
                if (ds != null)
                {
                    const dsNorm = String(ds).trim().toLowerCase();
                    if (dsNorm !== "true" && dsNorm !== "false") errors.push(`answer_to_guess diacritic-sensitive MUST be "true" or "false" if present (got "${String(ds).trim()}").`);
                }
            }

            if (errors.length) throw new Error(`Invalid hangman_simple scene (${scenePath}):\n` + errors.map(e => "• " + e).join("\n"));
        }

        async function parseSceneFileFromManifest(manifestItem)
        {
            const xmlText = await readZipText(manifestItem.hrefPath);
            const doc = parseXml(xmlText);

            validateSceneRootOrThrow(doc, manifestItem.role, manifestItem.hrefPath);

            const baseDir = dirname(manifestItem.hrefPath);
            const items = Array.from(doc.documentElement.children)
                .filter(el => el.tagName === "item")
                .map(el => parseItemElement(el, baseDir));

            switch (manifestItem.role)
            {
                case "mcq_simple":
                    validateMcqSimpleSceneOrThrow(items, manifestItem.hrefPath);
                    break;
                case "true_or_false_simple":
                    validateTrueOrFalseSimpleSceneOrThrow(items, manifestItem.hrefPath);
                    break;
                case "question_simple":
                    validateQuestionSimpleSceneOrThrow(items, manifestItem.hrefPath);
                    break;
                case "hangman_simple":
                    validateHangmanSimpleSceneOrThrow(items, manifestItem.hrefPath);
                    break;
                case "credits_simple":
                    validateCreditsSimpleSceneOrThrow(items, manifestItem.hrefPath);
                    break;
                case "game_title_simple":
                    validateGameTitleSimpleSceneOrThrow(items, manifestItem.hrefPath);
                    break;
                case "congratulations_simple":
                    validateCongratulationsSimpleSceneOrThrow(items, manifestItem.hrefPath);
                    break;
                case "game_over_simple":
                    validateGameOverSimpleSceneOrThrow(items, manifestItem.hrefPath);
                    break;
            }

            for (const it of items)
            {
                if (!it || !it.hrefPath) continue;
                const allowed = allowedMimesForSceneItemRole(it.role);
                assertAllowedMediaType(
                {
                    role: it.role,
                    mediaType: it.mediaType,
                    allowed,
                    context: `scene file="${manifestItem.hrefPath}"`
                });
            }

            return {
                items
            };
        }

        function findItemByRole(items, roles)
        {
            const set = new Set(Array.isArray(roles) ? roles : [roles]);
            return items.find(it => set.has(it.role)) || null;
        }

        function footerButton(label, opts = {})
        {
            const b = document.createElement("button");
            b.className = "btn" + (opts.kind ? ` ${opts.kind}` : "");
            b.textContent = label;
            if (opts.disabled) b.disabled = true;
            if (opts.onClick) b.addEventListener("click", opts.onClick);
            return b;
        }

        function nextLockedHint(text)
        {
            const hint = document.createElement("div");
            hint.className = "textBlock muted";
            hint.style.marginTop = "10px";

            // Accessibility (optional)

            hint.setAttribute("role", "status");
            hint.setAttribute("aria-live", "polite");

            hint.textContent = String(text ?? "");
            return hint;
        }

        async function renderResource(item, baseLabel)
        {
            const role = item.role || baseLabel || "resource";
            const media = item.mediaType || item["media-type"] || item.media_type || "";

            if (media === "text/plain" || role.endsWith("_text") || role === "text_simple" || role === "question_text")
            {
                let text = "";
                if (item.hrefPath) text = await readZipText(item.hrefPath);
                else text = item.inlineText || "";
                const div = document.createElement("div");
                div.className = "textBlock";
                div.textContent = text;
                return div;
            }

            if (media?.startsWith("image/") || role.endsWith("_image") || role.includes("image"))
            {
                const img = document.createElement("img");
                img.className = "imgBlock";
                if (!item.hrefPath)
                {
                    img.alt = "Missing image href";
                    return img;
                }
                img.src = await readZipBlobUrl(item.hrefPath, media || "image/jpeg");
                img.alt = role;
                return img;
            }

            if (media?.startsWith("audio/") || role.endsWith("_audio") || role.includes("audio"))
            {
                const audio = document.createElement("audio");
                audio.controls = true;
                audio.preload = "auto";
                if (item.hrefPath) audio.src = await readZipBlobUrl(item.hrefPath, media || "audio/mpeg");
                audio.volume = fgMute?.checked ? 0 : clamp01(audioState.fgUserVolume);
                return audio;
            }

            if (media?.startsWith("video/") || role.endsWith("_video") || role.includes("video"))
            {
                const video = document.createElement("video");
                video.controls = true;
                video.preload = "auto";
                if (item.hrefPath) video.src = await readZipBlobUrl(item.hrefPath, media || "video/mp4");
                return video;
            }

            const pre = document.createElement("pre");
            pre.className = "textBlock muted";
            pre.textContent = `Unsupported resource: role=${role} media-type=${media}\n${item.hrefPath || ""}`;
            return pre;
        }

        async function render_text_simple(manifestItem)
        {
            sceneContent.appendChild(await renderResource(manifestItem, "text_simple"));
            sceneFooter.appendChild(footerButton(t("next"),
            {
                onClick: safeGoNext
            }));
        }

        async function render_image_simple(manifestItem)
        {
            sceneContent.appendChild(await renderResource(manifestItem, "image_simple"));
            sceneFooter.appendChild(footerButton(t("next"),
            {
                onClick: safeGoNext
            }));
        }

        async function render_video_simple(manifestItem)
        {
            const enableNext = (String(manifestItem.enableNextAtStart ?? "false").toLowerCase() === "true");
            const video = await renderResource(manifestItem, "video_simple");
            sceneContent.appendChild(video);

            let completed = false;

            // Specific video hint if Next is locked

            const hint = !enableNext ?
                nextLockedHint(t("watchFullVideoToProceedToNextScene")) :
                null;

            if (hint) sceneContent.appendChild(hint);

            const nextBtn = footerButton(t("next"),
            {
                onClick: safeGoNext,
                disabled: !enableNext
            });
            sceneFooter.appendChild(nextBtn);

            attachMainMedia(video,
            {
                primary: true
            });
            try
            {
                video.currentTime = 0;
                if (!isPaused) await video.play();
            }
            catch
            {}
            applyBgDuckIfNeeded();

            video.addEventListener("ended", () =>
            {
                completed = true;
                if (!enableNext) nextBtn.disabled = false;
                if (hint)
                {
                    try
                    {
                        hint.remove();
                    }
                    catch
                    {}
                }
                applyBgDuckIfNeeded();
            });

            if (!enableNext) nextBtn.disabled = !completed;
        }

        async function render_audio_simple(manifestItem)
        {
            const enableNext = (String(manifestItem.enableNextAtStart ?? "false").toLowerCase() === "true");
            const audio = await renderResource(manifestItem, "audio_simple");
            sceneContent.appendChild(audio);

            let completed = false;

            // Specific audio hint if Next is locked

            const hint = !enableNext ?
                nextLockedHint(t("listenToFullAudioToProceedToNextScene")) :
                null;

            if (hint) sceneContent.appendChild(hint);

            const nextBtn = footerButton(t("next"),
            {
                onClick: safeGoNext,
                disabled: !enableNext
            });
            sceneFooter.appendChild(nextBtn);

            attachMainMedia(audio,
            {
                primary: true
            });
            applyForegroundMuteIfNeeded();
            try
            {
                audio.currentTime = 0;
                if (!isPaused) await audio.play();
            }
            catch
            {}
            applyBgDuckIfNeeded();

            audio.addEventListener("ended", () =>
            {
                completed = true;
                if (!enableNext) nextBtn.disabled = false;
                if (hint)
                {
                    try
                    {
                        hint.remove();
                    }
                    catch
                    {}
                }
                applyBgDuckIfNeeded();
            });

            if (!enableNext) nextBtn.disabled = !completed;
        }

        async function render_mcq_simple(sceneId, manifestItem)
        {
            const
            {
                items
            } = await parseSceneFileFromManifest(manifestItem);
            const question = findItemByRole(items, ["mcq_question_text", "mcq_question_image", "mcq_question_audio", "mcq_question_video"]);
            const goodFb = findItemByRole(items, "mcq_good_answer_feedback_audio");
            const badFb = findItemByRole(items, "mcq_wrong_answer_feedback_audio");
            
            // Preserve XML order: keep answers in the order they appear in the scene XML
            const options = items.filter(it =>
                typeof it.role === "string" && (it.role.startsWith("good_answer_") || it.role.startsWith("wrong_answer_"))
            );

            if (question) sceneContent.appendChild(await renderResource(question, "question"));

            const grid = document.createElement("div");
            grid.className = "choices";
            let locked = false;

            const playFeedback = async (fbItem) =>
            {
                if (!fbItem) return;
                const fb = new Audio();
                fb.src = await readZipBlobUrl(fbItem.hrefPath, fbItem.mediaType || "audio/mpeg");
                fb.volume = fgMute?.checked ? 0 : clamp01(audioState.fgUserVolume);
                attachMainMedia(fb,
                {
                    primary: false
                });
                applyForegroundMuteIfNeeded();
                try
                {
                    if (!isPaused) await fb.play();
                }
                catch
                {}
                await new Promise(res => fb.addEventListener("ended", res,
                {
                    once: true
                }));
                stopAndRevoke(fb);
            };

            const completeAndAdvance = () =>
            {
                if (shouldOverrideToGameOver())
                {
                    lockGameplayProgressAtCurrentScene();
                    return safeGoToSceneId(gameState.idGameOver);
                }
                safeGoNext();
            };

            for (const opt of options)
            {
                const btn = document.createElement("button");
                btn.className = "choice";
                btn.type = "button";
                btn.setAttribute("aria-disabled", "false");

                const badge = document.createElement("div");
                badge.className = "badge";
                badge.textContent = t("option");
                btn.appendChild(badge);
                btn.appendChild(await renderResource(opt, "answer"));

                btn.addEventListener("click", async () =>
                {
                    if (locked || isPaused) return;
                    locked = true;
                    
                    Array.from(grid.querySelectorAll(".choice")).forEach(x =>
                    {
                        x.setAttribute("aria-disabled", "true");
                        x.disabled = true;
                    });

                    const isCorrect = opt.role.startsWith("good_answer_");
                    
                    btn.classList.add(isCorrect ? "correct" : "wrong");
                    
                    if (!isCorrect)
                    {
                        gameState.wrongCount += 1;
                        if (kvWrong) setText(kvWrong, `${gameState.wrongCount} / ${gameState.maxWrong}`);
                    }

                    await playFeedback(isCorrect ? goodFb : badFb);
                    completeAndAdvance();
                });

                grid.appendChild(btn);
            }

            sceneContent.appendChild(grid);
        }

        async function render_true_or_false_simple(sceneId, manifestItem)
        {
            const
            {
                items
            } = await parseSceneFileFromManifest(manifestItem);
            const question = findItemByRole(items, ["question_text", "question_image", "question_audio", "question_video"]);
            const goodFb = findItemByRole(items, "good_answer_feedback_audio");
            const badFb = findItemByRole(items, "wrong_answer_feedback_audio");
            const correct = findItemByRole(items, "correct_answer");
            const expected = String(correct?.value || "").trim();

            if (question) sceneContent.appendChild(await renderResource(question, "question"));

            const grid = document.createElement("div");
            grid.className = "choices";

            let locked = false;

            const playFeedback = async (fbItem) =>
            {
                if (!fbItem) return;
                const fb = new Audio();
                fb.src = await readZipBlobUrl(fbItem.hrefPath, fbItem.mediaType || "audio/mpeg");
                fb.volume = fgMute?.checked ? 0 : clamp01(audioState.fgUserVolume);
                attachMainMedia(fb,
                {
                    primary: false
                });
                applyForegroundMuteIfNeeded();
                try
                {
                    if (!isPaused) await fb.play();
                }
                catch
                {}
                await new Promise(res => fb.addEventListener("ended", res,
                {
                    once: true
                }));
                stopAndRevoke(fb);
            };

            const completeAndAdvance = () =>
            {
                if (shouldOverrideToGameOver())
                {
                    lockGameplayProgressAtCurrentScene();
                    return safeGoToSceneId(gameState.idGameOver);
                }
                safeGoNext();
            };

            const mk = (label, val) =>
            {
                const btn = document.createElement("button");
                btn.className = "choice";
                btn.type = "button";
                btn.innerHTML = `<div class="badge">${escapeHtml(t("option"))}</div><div class="textBlock">${escapeHtml(label)}</div>`;
                btn.addEventListener("click", async () =>
                {
                    if (locked || isPaused) return;
                    locked = true;

                    Array.from(grid.querySelectorAll(".choice")).forEach(x =>
                    {
                        x.setAttribute("aria-disabled", "true");
                        x.disabled = true;
                    });

                    const isCorrect = (val === expected);

                    btn.classList.add(isCorrect ? "correct" : "wrong");

                    if (!isCorrect)
                    {
                        gameState.wrongCount += 1;
                        if (kvWrong) setText(kvWrong, `${gameState.wrongCount} / ${gameState.maxWrong}`);
                    }

                    await playFeedback(isCorrect ? goodFb : badFb);
                    completeAndAdvance();
                });
                return btn;
            };

            grid.appendChild(mk(t("true"), "true"));
            grid.appendChild(mk(t("false"), "false"));
            sceneContent.appendChild(grid);
        }

        async function render_question_simple(sceneId, manifestItem)
        {
            const
            {
                items
            } = await parseSceneFileFromManifest(manifestItem);
            const question = findItemByRole(items, ["question_text", "question_image", "question_audio", "question_video"]);
            const goodFb = findItemByRole(items, "good_answer_feedback_audio");
            const badFb = findItemByRole(items, "wrong_answer_feedback_audio");
            const answer = findItemByRole(items, "answer_to_guess");

            const expectedRaw = String(answer?.value ?? "");
            const caseSensitive = String(answer?.caseSensitive ?? answer?.["case-sensitive"]).toLowerCase() === "true";
            const diacriticSensitive = String(answer?.diacriticSensitive ?? answer?.["diacritic-sensitive"]).toLowerCase() === "true";

            if (question) sceneContent.appendChild(await renderResource(question, "question"));

            const input = document.createElement("input");
            input.className = "textInput";
            input.placeholder = t("typeAnswer");
            input.autocomplete = "off";

            // --- Feedback helpers (picked / is-correct / is-wrong)
            
            const clearInputFeedback = () =>
            {
                input.classList.remove("picked", "is-correct", "is-wrong");
            };

            const setInputFeedback = (isCorrect) =>
            {
                clearInputFeedback();
                input.classList.add("picked", isCorrect ? "is-correct" : "is-wrong");
            };

            input.addEventListener("input", clearInputFeedback);

            const submit = footerButton(t("submit"),
            {
                kind: "good"
            });
            const row = document.createElement("div");
            row.className = "inputRow";
            row.appendChild(input);
            row.appendChild(submit);
            sceneContent.appendChild(row);

            const playFeedback = async (fbItem) =>
            {
                if (!fbItem) return;
                const fb = new Audio();
                fb.src = await readZipBlobUrl(fbItem.hrefPath, fbItem.mediaType || "audio/mpeg");
                fb.volume = fgMute?.checked ? 0 : clamp01(audioState.fgUserVolume);
                attachMainMedia(fb,
                {
                    primary: false
                });
                applyForegroundMuteIfNeeded();
                try
                {
                    if (!isPaused) await fb.play();
                }
                catch
                {}
                await new Promise(res => fb.addEventListener("ended", res,
                {
                    once: true
                }));
                stopAndRevoke(fb);
            };

            const completeAndAdvance = () =>
            {
                if (shouldOverrideToGameOver())
                {
                    lockGameplayProgressAtCurrentScene();
                    return safeGoToSceneId(gameState.idGameOver);
                }
                safeGoNext();
            };

            let locked = false;

            const doSubmit = async () =>
            {
                if (locked || isPaused) return;
                locked = true;
                input.disabled = true;
                submit.disabled = true;

                const got = normalizeAnswer(input.value,
                {
                    caseSensitive,
                    diacriticSensitive
                });
                const expected = normalizeAnswer(expectedRaw,
                {
                    caseSensitive,
                    diacriticSensitive
                });
                const isCorrect = (got === expected);

                setInputFeedback(isCorrect);
                await new Promise(requestAnimationFrame);

                if (!isCorrect)
                {
                    gameState.wrongCount += 1;
                    if (kvWrong) setText(kvWrong, `${gameState.wrongCount} / ${gameState.maxWrong}`);
                }

                await playFeedback(isCorrect ? goodFb : badFb);
                clearInputFeedback();

                completeAndAdvance();
            };

            submit.addEventListener("click", doSubmit);
            input.addEventListener("keydown", (e) =>
            {
                if (e.key === "Enter") doSubmit();
            });
        }

        async function render_hangman_simple(sceneId, manifestItem)
        {
            const
            {
                items
            } = await parseSceneFileFromManifest(manifestItem);

            const goodAudio = findItemByRole(items, "good_answer_audio");
            const badAudio = findItemByRole(items, "wrong_answer_audio");
            const answer = findItemByRole(items, "answer_to_guess");

            const expectedRaw = String(answer?.value ?? "");
            const caseSensitive = String(answer?.caseSensitive ?? answer?.["case-sensitive"]).toLowerCase() === "true";
            const diacriticSensitive = String(answer?.diacriticSensitive ?? answer?.["diacritic-sensitive"]).toLowerCase() === "true";

            const statuses = items
                .filter(it => /^hangman_status_\d+$/i.test(it.role))
                .sort((a, b) => parseInt(a.role.split("_").pop(), 10) - parseInt(b.role.split("_").pop(), 10));

            let statusIndex = 0;
            const maxStatus = statuses.length ? (statuses.length - 1) : 6;

            const expectedNorm = normalizeAnswer(expectedRaw,
            {
                caseSensitive,
                diacriticSensitive
            });

            // Split into grapheme clusters (so emoji / combined chars behave as single "characters")

            function splitGraphemes(str)
            {
                const s = String(str ?? "");
                if (!s) return [];
                try
                {
                    if (window.Intl && Intl.Segmenter)
                    {
                        const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });

                        return Array.from(seg.segment(s), x => x.segment);
                    }
                }
                catch {}
                try { return Array.from(s); } catch {}
    
                return s.split("");
            }

            const expectedChars = splitGraphemes(expectedNorm);
            const expectedRawChars = splitGraphemes(expectedRaw);

            let guessed = new Set();
            const revealed = expectedChars.map(ch => (ch === " " ? " " : "_"));

            const wrap = document.createElement("div");
            wrap.className = "hangman";
            const left = document.createElement("div");
            const right = document.createElement("div");
            right.className = "right";

            const statusImgHolder = document.createElement("div");

            const renderStatusImage = async () =>
            {
                statusImgHolder.innerHTML = "";
                
                if (statuses.length)
                {
                    statusImgHolder.appendChild(await renderResource(statuses[Math.min(statusIndex, maxStatus)], "hangman_status"));
                }
                else
                {
                    const ph = document.createElement("div");
                    ph.className = "notice";
                    ph.textContent = "No hangman_status_* images found; using text-only status.";
                    statusImgHolder.appendChild(ph);
                }
            };

            await renderStatusImage();
            right.appendChild(statusImgHolder);

            const word = document.createElement("div");
            word.className = "word";
            word.style.whiteSpace = "pre-wrap";
            const renderWord = () =>
            {
                word.textContent = revealed.map((c, i) => expectedChars[i] === " " ? " " : c).join(" ");
            };
            renderWord();
            right.appendChild(word);

            const hangmanPrompt = document.createElement("div");
            hangmanPrompt.className = "textBlock";
            hangmanPrompt.style.marginTop = "10px";
            hangmanPrompt.textContent = t("guessSecretWord");
            right.appendChild(hangmanPrompt);

            const used = document.createElement("div");
            used.className = "used";
            const renderUsed = () =>
            {
                const list = (Array.from(guessed).sort().join(", ") || "—");
                used.textContent = t("used",
                {
                    list
                });
            };
            renderUsed();
            right.appendChild(used);

            const input = document.createElement("input");
            input.className = "textInput";
            input.placeholder = t("enterCharacter");
            input.autocomplete = "off";
            input.spellcheck = false;
            input.maxLength = 8;
            input.inputMode = "text";
            input.enterKeyHint = "done";
            input.autocapitalize = "off";
            input.autocorrect = "off";

             // --- Feedback helpers (picked / is-correct / is-wrong)
              
            const clearGuessFeedback = () =>
            {
                input.classList.remove("picked", "is-correct", "is-wrong");
            };

            const setGuessFeedback = (isCorrect) =>
            {
               clearGuessFeedback();
               input.classList.add("picked", isCorrect ? "is-correct" : "is-wrong");
            };

            function firstGrapheme(str)
            {
                const s = String(str ?? "");

                if (!s) return "";

                try
                {
                    if (window.Intl && Intl.Segmenter)
                    {
                        const seg = new Intl.Segmenter(undefined,
                        {
                            granularity: "grapheme"
                        });
                        const it = seg.segment(s)[Symbol.iterator]().next();

                        return it && it.value ? it.value.segment : "";
                    }
                }
                catch
                {}
                try
                {
                    return Array.from(s)[0] || "";
                }
                catch
                {}

                return s.charAt(0) || "";
            }

            function sanitizeHangmanGuessDisplay(raw)
            {
                // Accept ANY single character (grapheme), not only a letter.
                // Reject empty / whitespace (spaces in the answer are auto-revealed).
                
                const g = firstGrapheme(raw);
                if (!g) return "";
                if (/^\s$/u.test(g)) return "";

                const norm = normalizeAnswer(g,
                {
                    caseSensitive,
                    diacriticSensitive
                });
                // Keep it to a single grapheme after normalization
    
                return norm ? firstGrapheme(norm) : "";
            }

            input.addEventListener("input", () =>
            {
                clearGuessFeedback();
                const clean = sanitizeHangmanGuessDisplay(input.value);
                input.value = clean || "";
            });

            input.addEventListener("beforeinput", (e) =>
            {
                if (!e.data) return;
                const clean = sanitizeHangmanGuessDisplay(e.data);
                if (!clean) e.preventDefault();
            });

            input.addEventListener("paste", (e) =>
            {
                const text = (e.clipboardData || window.clipboardData)?.getData("text") || "";
                const clean = sanitizeHangmanGuessDisplay(text);
                e.preventDefault();
                input.value = clean || "";
            });

            const guessBtn = footerButton(t("guess"),
            {
                kind: "good"
            });
            const inRow = document.createElement("div");
            inRow.className = "inputRow";
            inRow.appendChild(input);
            inRow.appendChild(guessBtn);
            right.appendChild(inRow);

            wrap.appendChild(left);
            wrap.appendChild(right);
            sceneContent.appendChild(wrap);

            let locked = false;

            const playOnce = async (audioItem) =>
            {
                if (!audioItem) return;
                const el = new Audio();
                el.src = await readZipBlobUrl(audioItem.hrefPath, audioItem.mediaType || "audio/mpeg");
                el.volume = fgMute?.checked ? 0 : clamp01(audioState.fgUserVolume);
                attachMainMedia(el,
                {
                    primary: false
                });
                applyForegroundMuteIfNeeded();
                try
                {
                    if (!isPaused) await el.play();
                }
                catch
                {}
                await new Promise(res => el.addEventListener("ended", res,
                {
                    once: true
                }));
                stopAndRevoke(el);
            };

            const completeAndAdvance = () =>
            {
                if (shouldOverrideToGameOver())
                {
                    lockGameplayProgressAtCurrentScene();
                    return safeGoToSceneId(gameState.idGameOver);
                }
                safeGoNext();
            };

            const checkWin = () => revealed.every((c, i) => expectedChars[i] === " " || c !== "_");

            const finish = async () =>
            {
                locked = true;
                input.disabled = true;
                guessBtn.disabled = true;
                completeAndAdvance();
            };

            const doGuess = async () =>
            {
                if (locked || isPaused) return;
                const ch = sanitizeHangmanGuessDisplay(input.value || "");
                if (!ch) return;
                input.value = "";

                if (guessed.has(ch)) return;

                guessed.add(ch);
                renderUsed();

                let anyHit = false;
                for (let i = 0; i < expectedChars.length; i++)
                {
                    if (expectedChars[i] === ch)
                    {
                        revealed[i] = (expectedRawChars[i] ?? expectedChars[i]);
                        anyHit = true;
                    }
                }

                if (!anyHit)
                {
                    setGuessFeedback(false);
                    await new Promise(requestAnimationFrame);

                    gameState.wrongCount += 1;
                    if (kvWrong) setText(kvWrong, `${gameState.wrongCount} / ${gameState.maxWrong}`);

                    statusIndex = Math.min(statusIndex + 1, maxStatus);
                    await renderStatusImage();
                    await new Promise(requestAnimationFrame);

                    await playOnce(badAudio);
                    clearGuessFeedback();

                    if (shouldOverrideToGameOver())
                    {
                        lockGameplayProgressAtCurrentScene();

                        return safeGoToSceneId(gameState.idGameOver);
                    }

                    if (statusIndex >= maxStatus)
                    {
                        await finish(false);

                        return;
                    }
                }

                else
                {
                    setGuessFeedback(true);
                    await new Promise(requestAnimationFrame);

                    renderWord();
                    await new Promise(requestAnimationFrame);
                    await playOnce(goodAudio);   
                    clearGuessFeedback();                 

                    if (checkWin())
                    {
                        await finish(true);
                        return;
                    }
                }
            };

            guessBtn.addEventListener("click", doGuess);
            input.addEventListener("keydown", (e) =>
            {
                if (e.key === "Enter") doGuess();
            });
        }

        async function render_game_title_simple(sceneId, manifestItem)
        {
            const
            {
                items
            } = await parseSceneFileFromManifest(manifestItem);
            const imgItem = findItemByRole(items, "game_title_image");
            const audItem = findItemByRole(items, "game_title_audio");

            if (imgItem) sceneContent.appendChild(await renderResource(imgItem, "game_title_image"));

            if (audItem)
            {
                const a = new Audio();
                a.loop = true;
                a.src = await readZipBlobUrl(audItem.hrefPath, audItem.mediaType || "audio/mpeg");
                a.volume = fgMute?.checked ? 0 : clamp01(audioState.fgUserVolume);
                attachMainMedia(a,
                {
                    primary: true
                });
                applyForegroundMuteIfNeeded();

                const ok = await safePlay(a);

                // If blocked, show an explicit button,
                // which disappears as soon as the sound starts.

                if (!ok)
                {
                    const btn = footerButton(t("enableSoundNow"),
                    {
                        kind: "secondary",
                        onClick: async () =>
                        {
                            // click = user gesture → play must go through

                            const started = await safePlay(a,
                            {
                                queueIfBlocked: false
                            });
                            if (started)
                            {
                              // Removal will also be done by the "play" event, but we can do it right away

                                try
                                {
                                    btn.remove();
                                }
                                catch
                                {}
                            }
                        }
                    });

                    // If the audio starts (on click, or via the first gesture elsewhere), remove the button

                    const cleanup = () =>
                    {
                        a.removeEventListener("play", cleanup);
                        try
                        {
                            btn.remove();
                        }
                        catch
                        {}
                    };
                    a.addEventListener("play", cleanup,
                    {
                        once: true
                    });

                    sceneFooter.appendChild(btn);
                }

            }

            sceneFooter.appendChild(footerButton(t("start"),
            {
                kind: "good",
                onClick: () =>
                {
                    if (isPaused) return;
                    gameState.sessionActive = true;
                    gameState.wrongCount = 0;
                    if (kvWrong) setText(kvWrong, "0");
                    safeGoNext();
                }
            }));

            sceneFooter.appendChild(footerButton(t("credits"),
            {
                onClick: () =>
                {
                    if (gameState.idCredits) safeGoToSceneId(gameState.idCredits);
                }
            }));
        }

        async function render_congratulations_simple(sceneId, manifestItem)
        {
            const
            {
                items
            } = await parseSceneFileFromManifest(manifestItem);
            const imgItem = findItemByRole(items, "congratulations_image");
            const audItem = findItemByRole(items, "congratulations_audio");

            if (imgItem) sceneContent.appendChild(await renderResource(imgItem, "congratulations_image"));

            const playAgainBtn = footerButton(t("playAgain"),
            {
                kind: "good",
                disabled: true,
                onClick: () =>
                {
                    if (isPaused) return;
                    gameState.sessionActive = false;
                    gameState.wrongCount = 0;
                    if (kvWrong) setText(kvWrong, "0");
                    if (gameState.idGameTitle) safeGoToSceneId(gameState.idGameTitle);
                }
            });

            sceneFooter.appendChild(playAgainBtn);
            sceneFooter.appendChild(footerButton(t("credits"),
            {
                onClick: () =>
                {
                    if (gameState.idCredits) safeGoToSceneId(gameState.idCredits);
                }
            }));

            if (audItem)
            {
                const a = new Audio();
                a.src = await readZipBlobUrl(audItem.hrefPath, audItem.mediaType || "audio/mpeg");
                a.volume = fgMute?.checked ? 0 : clamp01(audioState.fgUserVolume);
                attachMainMedia(a,
                {
                    primary: true
                });
                applyForegroundMuteIfNeeded();
                try
                {
                    if (!isPaused) await a.play();
                }
                catch
                {}
                a.addEventListener("ended", () =>
                {
                    playAgainBtn.disabled = false;
                    applyBgDuckIfNeeded();
                });
            }
            else
            {
                playAgainBtn.disabled = false;
            }
        }

        async function render_game_over_simple(sceneId, manifestItem)
        {
            const
            {
                items
            } = await parseSceneFileFromManifest(manifestItem);
            const imgItem = findItemByRole(items, "game_over_image");
            const audItem = findItemByRole(items, "game_over_audio");

            if (imgItem) sceneContent.appendChild(await renderResource(imgItem, "game_over_image"));

            const playAgainBtn = footerButton(t("playAgain"),
            {
                kind: "good",
                disabled: true,
                onClick: () =>
                {
                    if (isPaused) return;
                    gameState.sessionActive = false;
                    gameState.wrongCount = 0;
                    if (kvWrong) setText(kvWrong, "0");
                    if (gameState.idGameTitle) safeGoToSceneId(gameState.idGameTitle);
                }
            });

            sceneFooter.appendChild(playAgainBtn);
            sceneFooter.appendChild(footerButton(t("credits"),
            {
                onClick: () =>
                {
                    if (gameState.idCredits) safeGoToSceneId(gameState.idCredits);
                }
            }));

            if (audItem)
            {
                const a = new Audio();
                a.src = await readZipBlobUrl(audItem.hrefPath, audItem.mediaType || "audio/mpeg");
                a.volume = fgMute?.checked ? 0 : clamp01(audioState.fgUserVolume);
                attachMainMedia(a,
                {
                    primary: true
                });
                applyForegroundMuteIfNeeded();
                try
                {
                    if (!isPaused) await a.play();
                }
                catch
                {}
                a.addEventListener("ended", () =>
                {
                    playAgainBtn.disabled = false;
                    applyBgDuckIfNeeded();
                });
            }
            else
            {
                playAgainBtn.disabled = false;
            }
        }

        async function render_credits_simple(sceneId, manifestItem)
        {
            const
            {
                items
            } = await parseSceneFileFromManifest(manifestItem);
            const fields = items.filter(it => it.role === "credit_field");

            const list = document.createElement("div");
            list.style.display = "grid";
            list.style.gap = "10px";

            for (const f of fields)
            {
                const label = (f.children.find(x => x.role === "label")?.inlineText || "").trim();
                const content = (f.children.find(x => x.role === "content")?.inlineText || "").trim();

                const card = document.createElement("div");
                card.style.border = "1px solid var(--borderSoft2)";
                card.style.borderRadius = "14px";
                card.style.background = "var(--surface2)";
                card.style.padding = "10px 12px";

                const l = document.createElement("div");
                l.style.fontWeight = "900";
                l.style.marginBottom = "4px";
                l.textContent = label || "—";

                const c = document.createElement("div");
                c.className = "textBlock";
                c.style.fontSize = "15px";
                c.style.opacity = ".95";
                c.textContent = content || "—";

                card.appendChild(l);
                card.appendChild(c);
                list.appendChild(card);
            }

            sceneContent.appendChild(list);
            sceneFooter.appendChild(footerButton(t("backToTitle"),
            {
                onClick: () =>
                {
                    if (gameState.idGameTitle) safeGoToSceneId(gameState.idGameTitle);
                }
            }));
            sceneFooter.appendChild(footerButton(t("exit"),
            {
                onClick: () =>
                {
                    alert(t("exitBlocked"));
                }
            }));
        }

        async function renderUnknownScene(sceneId, manifestItem)
        {
            const msg = document.createElement("div");
            msg.className = "notice warn";
            msg.innerHTML = `<b>Unknown scene role:</b> <code>${escapeHtml(manifestItem.role||"(none)")}</code><br><br><span class="muted">Rendering a generic fallback. You can skip to the next scene.</span>`;
            sceneContent.appendChild(msg);
            sceneFooter.appendChild(footerButton(t("skip"),
            {
                onClick: safeGoNext
            }));
        }

        async function renderCurrentScene()
        {
            sceneContent.innerHTML = "";
            sceneFooter.innerHTML = "";
            stopMainMedia();
            stopAllForegroundAudio();
            revokeSceneObjectUrls();

            const sceneId = sequence[gameState.currentIndex];
            const manifestItem = manifestById.get(sceneId);

            // BG policy based on the scene role

            bgMode = computeBgModeForRole(manifestItem?.role);

            // Apply immediately (cut the BG if it was coming from the previous scene)

            applyBgDuckIfNeeded();

            await ensureBackgroundAudioForScene(gameState.currentIndex);

            // EGF 1.1: always allow FG (if there’s no item for sceneId, nothing will play anyway)

            await playForegroundAudioForScene(sceneId);

            if (!manifestItem)
            {
                const warn = document.createElement("div");
                warn.className = "notice warn";
                warn.textContent = `Scene "${sceneId}" is referenced in <sequence> but missing from <manifest>.`;
                sceneContent.appendChild(warn);
                sceneFooter.appendChild(footerButton(t("skip"),
                {
                    onClick: safeGoNext
                }));
                return;
            }

            switch (manifestItem.role)
            {
                case "game_title_simple":
                    await render_game_title_simple(sceneId, manifestItem);
                    break;
                case "congratulations_simple":
                    await render_congratulations_simple(sceneId, manifestItem);
                    break;
                case "game_over_simple":
                    await render_game_over_simple(sceneId, manifestItem);
                    break;
                case "credits_simple":
                    await render_credits_simple(sceneId, manifestItem);
                    break;

                case "mcq_simple":
                    await render_mcq_simple(sceneId, manifestItem);
                    break;
                case "hangman_simple":
                    await render_hangman_simple(sceneId, manifestItem);
                    break;
                case "question_simple":
                    await render_question_simple(sceneId, manifestItem);
                    break;
                case "true_or_false_simple":
                    await render_true_or_false_simple(sceneId, manifestItem);
                    break;

                case "text_simple":
                    await render_text_simple(manifestItem);
                    break;
                case "image_simple":
                    await render_image_simple(manifestItem);
                    break;
                case "video_simple":
                    await render_video_simple(manifestItem);
                    break;
                case "audio_simple":
                    await render_audio_simple(manifestItem);
                    break;

                default:
                    await renderUnknownScene(sceneId, manifestItem);
                    break;
            }

            applyForegroundMuteIfNeeded();
            applyBgDuckIfNeeded();

            if (isPaused)
            {
                setSceneControlsDisabled(true);
                pauseAllMediaInDom();
                try
                {
                    audioState.bg?.pause();
                }
                catch
                {}
            }
        }

        function validateSpecialScenesUniquenessInManifestOrThrow()
        {
            const requiredSpecialRoles = ["game_title_simple", "congratulations_simple", "game_over_simple", "credits_simple"];
            const errors = [];

            for (const role of requiredSpecialRoles)
            {
                const ids = [];
                for (const [id, it] of manifestById.entries())
                    if (it?.role === role) ids.push(id);

                if (ids.length === 0) errors.push(`Invalid EGF: manifest MUST contain exactly one item with role="${role}" (found 0).`);
                else if (ids.length > 1) errors.push(`Invalid EGF: manifest MUST NOT contain duplicate items with role="${role}" (found ${ids.length}: ${ids.map(x=>`"${x}"`).join(", ")}).`);
            }

            if (errors.length) throw new Error(errors.join("\n"));
        }

        function findSpecialSceneIds()
        {
            gameState.idGameTitle = sequence[0] || null;

            for (const [id, it] of manifestById.entries())
            {
                if (it.role === "game_title_simple") gameState.idGameTitle = id;
                if (it.role === "congratulations_simple") gameState.idCongratulations = id;
                if (it.role === "game_over_simple") gameState.idGameOver = id;
                if (it.role === "credits_simple") gameState.idCredits = id;
                if (it.role === "egf_cover") gameState.coverItem = it;
            }
        }

        function buildSceneIndexMap()
        {
            sceneIndexById = new Map();
            sequence.forEach((id, idx) => sceneIndexById.set(id, idx));
        }

        function validateSequenceOrderOrThrow(
        {
            compat10 = false
        } = {})
        {
            const errors = [];

            const missing = [];
            if (!gameState.idGameTitle) missing.push("game_title_simple");
            if (!gameState.idCongratulations) missing.push("congratulations_simple");
            if (!gameState.idGameOver) missing.push("game_over_simple");
            if (!gameState.idCredits) missing.push("credits_simple");
            if (missing.length) errors.push(`Invalid EGF: missing required Special Scene(s): ${missing.join(", ")}.`);

            if (!errors.length)
            {
                const last = sequence.length - 1;
                const idxTitle = sceneIndexById.get(gameState.idGameTitle);
                const idxCongrats = sceneIndexById.get(gameState.idCongratulations);
                const idxGameOver = sceneIndexById.get(gameState.idGameOver);
                const idxCredits = sceneIndexById.get(gameState.idCredits);

                if (idxTitle == null) errors.push("Invalid EGF: game_title_simple not found in <sequence>.");
                if (idxCongrats == null) errors.push("Invalid EGF: congratulations_simple not found in <sequence>.");
                if (idxGameOver == null) errors.push("Invalid EGF: game_over_simple not found in <sequence>.");
                if (idxCredits == null) errors.push("Invalid EGF: credits_simple not found in <sequence>.");

                if (!errors.length)
                {
                    if (idxTitle !== 0) errors.push(`Invalid EGF: Game Title Scene MUST be first (found at index ${idxTitle}).`);
                    if (idxCredits !== last) errors.push(`Invalid EGF: Credits Scene MUST be last (found at index ${idxCredits}, expected ${last}).`);
                    if (idxGameOver !== last - 1) errors.push(`Invalid EGF: Game Over MUST be penultimate (found at index ${idxGameOver}, expected ${last - 1}).`);
                    if (idxCongrats !== last - 2) errors.push(`Invalid EGF: Congratulations MUST be antepenultimate (found at index ${idxCongrats}, expected ${last - 2}).`);
                    if (idxCongrats + 1 !== idxGameOver) errors.push(`Invalid EGF: Congratulations MUST be immediately followed by Game Over.`);
                    if (idxGameOver + 1 !== idxCredits) errors.push(`Invalid EGF: Game Over MUST be immediately followed by Credits.`);

                    const mustBeBetween = new Set(["text_simple", "image_simple", "video_simple", "audio_simple", "mcq_simple", "hangman_simple", "question_simple", "true_or_false_simple"]);

                    for (let i = 0; i < sequence.length; i++)
                    {
                        const sceneId = sequence[i];
                        const it = manifestById.get(sceneId);
                        const role = it?.role;
                        if (!role) continue;
                        if (mustBeBetween.has(role))
                        {
                            if (!(i > idxTitle && i < idxCongrats))
                            {
                                errors.push(`Invalid EGF: Scene "${sceneId}" with role "${role}" MUST be placed between Game Title and Congratulations (found at index ${i}).`);
                            }
                        }
                    }
                }
            }

            if (errors.length)
            {
                if (compat10)
                {
                    setWarnings(["⚠️ EGF 1.0 compatibility mode: sequence order constraints are relaxed.", ...errors], true);
                    return;
                }
                setWarnings(errors, true);
                throw new Error(errors.join("\n"));
            }
            else
            {
                setWarnings([], true);
            }
        }

        // -------------------------
        // GAME load from URL (WP)
        // -------------------------

        async function loadGameFromUrl(url)
        {
            setWarnings([]);
            sceneContent.innerHTML = `<div class="textBlock muted">${escapeHtml(t("loading"))}</div>`;
            sceneFooter.innerHTML = "";
            sceneName.textContent = t("loading");
            sceneSub.textContent = "";

            isPaused = false;
            pendingNav = null;
            pauseSnapshot = null;
            root.classList.remove("paused");
            if (btnPause)
            {
                setText(btnPause, t("pause"));
                btnPause.classList.remove("pauseOn");
            }

            stopMainMedia();
            stopAllForegroundAudio();

            if (audioState.bg)
            {
                stopAndRevoke(audioState.bg);
                audioState.bg = null;
                audioState.bgItemId = null;
            }

            revokeCoverUrl();
            setCoverUrl(null);
            revokeSceneObjectUrls();

            coreRootfileId = null;
            zip = null;
            corePath = null;

            manifestById.clear();
            settingsRefs.clear();
            settingsRefCounts.clear();
            sequence = [];
            sceneIndexById.clear();

            meta = {
                title: "—",
                creator: "—",
                description: "—",
                date: "—",
                modified: "—"
            };
            gameState.sessionActive = false;
            gameState.wrongCount = 0;
            gameState.lastGameplayPct = 0;

            // Fetch (WP)

            function withCacheBuster(u)
            {
                try
                {
                    const x = new URL(u, window.location.href);
                    x.searchParams.set("_egf_nc", String(Date.now()));
                    return x.toString();
                }
                catch
                {
                    const sep = u.includes("?") ? "&" : "?";
                    return u + sep + "_egf_nc=" + Date.now();
                }
            }

            const fetchUrl = noCacheFetch ? withCacheBuster(url) : url;

            const res = await fetch(fetchUrl,
            {
                credentials: "same-origin",
                cache: "no-store",
                headers:
                {
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                    "Pragma": "no-cache"
                }
            });

            if (!res.ok) throw new Error(`Failed to fetch EGF (${res.status} ${res.statusText}).`);
            const buf = await res.arrayBuffer();

            // Strict ZIP order check (warning)

            try
            {
                validateMimetypeFirstOrThrow(buf);
            }
            catch (e)
            {
                setWarnings([`⚠️ ZIP not strictly conforming: ${String(e?.message || e)}`], true);
            }

            zip = await JSZip.loadAsync(buf);
            await validateMimetypeOrThrow(zip);

            corePath = await locateCoreFile(zip);
            coreDir = dirname(corePath);

            const coreXml = await readZipText(corePath);
            const coreDoc = parseXml(coreXml);

            const egf = coreDoc.documentElement;
            if (egf.tagName !== "egf") throw new Error("Core file root element is not <egf>.");

            egfVersion = (egf.getAttribute("version") || "1.1").trim();
            parseMetadata(coreDoc);
            updateHeaderIdentity();

            const manifestEl = coreDoc.querySelector("manifest");
            if (!manifestEl) throw new Error("Missing <manifest>.");

            for (const el of Array.from(manifestEl.children).filter(x => x.tagName === "item"))
            {
                const it = {
                    id: getAttr(el, "id"),
                    role: getAttr(el, "role"),
                    mediaType: getAttr(el, "media-type"),
                    hrefRaw: getAttr(el, "href"),
                    hrefPath: null,
                    value: getAttr(el, "value"),
                    enableNextAtStart: getAttr(el, "enable-next-button-at-start"),
                    scopeFromId: getAttr(el, "scope-from"),
                    scopeToId: getAttr(el, "scope-to"),
                    sceneRef: getAttr(el, "scene-ref")
                };

                if (!it.id) continue;
                if (manifestById.has(it.id)) throw new Error(`Invalid EGF: duplicate manifest item id="${it.id}".`);
                if (it.hrefRaw) it.hrefPath = resolveRelative(coreDir, it.hrefRaw);
                manifestById.set(it.id, it);
            }

            // Enforce href + mime for known roles

            for (const [id, it] of manifestById.entries())
            {
                const role = String(it?.role || "");
                const allowed = ROLE_MIME_RULES_MANIFEST[role];
                if (!allowed) continue;
                if (!it.hrefPath) throw new Error(`Invalid EGF: manifest item id="${id}" role="${role}" MUST have href.`);
                assertAllowedMediaType(
                {
                    role,
                    mediaType: it.mediaType,
                    allowed,
                    context: `manifest item id="${id}"`
                });
            }

            validateSpecialScenesUniquenessInManifestOrThrow();

            const settingsEl = coreDoc.querySelector("settings");
            if (!settingsEl) throw new Error('Invalid EGF: missing required <settings> element.');

            for (const el of Array.from(settingsEl.children).filter(x => x.tagName === "setting"))
            {
                const ref = getAttr(el, "ref");
                if (!ref) continue;
                settingsRefs.add(ref);
                settingsRefCounts.set(ref, (settingsRefCounts.get(ref) || 0) + 1);
            }

            for (const [ref] of settingsRefCounts.entries())
            {
                if (!manifestById.has(ref)) throw new Error(`Invalid EGF: <settings> references unknown manifest id "${ref}".`);
            }

            const seqEl = coreDoc.querySelector("sequence");
            if (!seqEl) throw new Error("Missing <sequence>.");

            sequence = Array.from(seqEl.children)
                .filter(x => x.tagName === "scene")
                .map(x => (x.getAttribute("ref") || "").trim())
                .filter(Boolean);

            if (!sequence.length) throw new Error("Empty <sequence>.");

            buildSceneIndexMap();
            findSpecialSceneIds();
            validateSequenceOrderOrThrow(
            {
                compat10: false
            });

            if (gameState.coverItem?.hrefPath)
            {
                try
                {
                    const urlCover = await readZipBlobUrl(gameState.coverItem.hrefPath, gameState.coverItem.mediaType || "image/jpeg");
                    setCoverUrl(urlCover, meta?.title || "");
                }
                catch
                {
                    setCoverUrl(null);
                }
            }
            else
            {
                setCoverUrl(null);
            }

            const maxWrongItems = Array.from(manifestById.values()).filter(it => it?.role === "max_wrong_answers");
            if (maxWrongItems.length !== 1) throw new Error(`Invalid EGF: manifest MUST contain exactly one item with role="max_wrong_answers" (found ${maxWrongItems.length}).`);

            const maxItem = maxWrongItems[0];
            const refCount = settingsRefCounts.get(maxItem.id) || 0;
            if (refCount !== 1) throw new Error(`Invalid EGF: <settings> MUST contain exactly one <setting ref="${maxItem.id}"> (found ${refCount}).`);

            const parsed = parseInt(String(maxItem.value ?? "").trim(), 10);
            if (!Number.isFinite(parsed) || parsed < 1) throw new Error(`Invalid EGF: max_wrong_answers value MUST be integer >= 1 (got "${maxItem.value ?? ""}").`);
            gameState.maxWrong = parsed;

            const idxTitle = sceneIndexById.get(gameState.idGameTitle) ?? 0;
            const idxCongrats = sceneIndexById.get(gameState.idCongratulations) ?? (sequence.length - 1);
            gameState.gameplayStartIdx = Math.min(idxTitle + 1, sequence.length - 1);
            gameState.gameplayEndIdx = Math.max(gameState.gameplayStartIdx, idxCongrats);
            gameState.lastGameplayPct = 0;

            buildAudioSettings();

            gameState.currentIndex = sceneIndexById.get(gameState.idGameTitle) ?? 0;

            setNavButtons();
            updateAboutUi();
            updateProgressUi();

            await renderCurrentScene();
        }

        function openAbout()
        {
            aboutModal?.classList.add("open");
            aboutModal?.setAttribute("aria-hidden", "false");
        }

        function closeAbout()
        {
            aboutModal?.classList.remove("open");
            aboutModal?.setAttribute("aria-hidden", "true");
        }

        function openScore()
        {
            updateAboutUi();
            updateProgressUi(); // xx% up to date
            syncScoreProgressGradient(); // ✅ gradient up to date
            scoreModal?.classList.add("open");
            scoreModal?.setAttribute("aria-hidden", "false");
        }

        function closeScore()
        {
            scoreModal?.classList.remove("open");
            scoreModal?.setAttribute("aria-hidden", "true");
        }

        function openSettings()
        {
            settingsModal?.classList.add("open");
            settingsModal?.setAttribute("aria-hidden", "false");
        }

        function closeSettings()
        {
            settingsModal?.classList.remove("open");
            settingsModal?.setAttribute("aria-hidden", "true");
        }

        btnAbout?.addEventListener("click", openAbout);
        btnCloseAbout?.addEventListener("click", closeAbout);
        aboutBackdrop?.addEventListener("click", closeAbout);

        btnScore?.addEventListener("click", openScore);
        btnCloseScore?.addEventListener("click", closeScore);
        scoreBackdrop?.addEventListener("click", closeScore);

        btnSettings?.addEventListener("click", openSettings);
        btnCloseSettings?.addEventListener("click", closeSettings);
        settingsBackdrop?.addEventListener("click", closeSettings);

        document.addEventListener("keydown", (e) =>
        {
            if (e.key !== "Escape") return;
            if (scoreModal?.classList.contains("open")) return closeScore();
            if (settingsModal?.classList.contains("open")) return closeSettings();
            if (aboutModal?.classList.contains("open")) return closeAbout();
        });

        btnReset?.addEventListener("click", async () =>
        {
            if (!zip) return;

            closeSettings();
            closeAbout();

            if (isPaused)
            {
                pauseSnapshot = null;
                pendingNav = null;
                await setPaused(false);
            }

            gameState.sessionActive = false;
            gameState.wrongCount = 0;
            if (kvWrong) setText(kvWrong, "0");
            gameState.lastGameplayPct = 0;

            goToSceneId(gameState.idGameTitle || sequence[0]);
        });

        btnPause?.addEventListener("click", async () =>
        {
            if (!zip) return;
            await setPaused(!isPaused);
        });
        btnResumeOverlay?.addEventListener("click", async () =>
        {
            if (!zip) return;
            await setPaused(false);
        });

        // Settings events

        updateVolumeLabels();
        if (bgVol) audioState.bgUserVolume = clamp01(parseInt(bgVol.value, 10) / 100);
        if (fgVol) audioState.fgUserVolume = clamp01(parseInt(fgVol.value, 10) / 100);

        bgMute?.addEventListener("change", () =>
        {
            applyBgDuckIfNeeded();
            if (!isPaused && audioState.bg && !bgMute.checked && audioState.bg.paused && !audioState.bgPausedForPrimary)
            {
                try
                {
                    audioState.bg.play();
                }
                catch
                {}
            }
        });

        fgMute?.addEventListener("change", () =>
        {
            applyForegroundMuteIfNeeded();
            applyBgDuckIfNeeded();
        });

        bgVol?.addEventListener("input", () =>
        {
            audioState.bgUserVolume = clamp01(parseInt(bgVol.value, 10) / 100);
            updateVolumeLabels();
            applyBgDuckIfNeeded();
        });

        fgVol?.addEventListener("input", () =>
        {
            audioState.fgUserVolume = clamp01(parseInt(fgVol.value, 10) / 100);
            updateVolumeLabels();
            applyForegroundMuteIfNeeded();
            applyBgDuckIfNeeded();
        });

        themeToggle?.addEventListener("change", () =>
        {
            const mode = themeToggle.checked ? "dark" : "light";
            applyTheme(mode);
        });

        langSelect?.addEventListener("change", () => applyLanguage(resolveLangKey(langSelect.value)));

        const initTheme = defaultTheme;

        function detectBrowserLang(allowedSet)
        {
            const candidates = [];
            try
            {
                if (Array.isArray(navigator.languages)) candidates.push(...navigator.languages);
            }
            catch
            {}
            if (navigator.language) candidates.push(navigator.language);

            for (const raw of candidates)
            {
                if (!raw) continue;
                const lang = String(raw).trim().toLowerCase(); // e.g. "fr-fr"
                const primary = lang.split(/[-_]/)[0]; // e.g. "fr"

                if (allowedSet.has(lang)) return lang;
                if (allowedSet.has(primary)) return primary;
            }
            return null;
        }

        const I18N = window.I18N ||
        {};

        function resolveLangKey(raw)
        {
            const s = String(raw || "").trim().toLowerCase().replaceAll("_", "-"); // fr_FR -> fr-fr
            const primary = s.split("-")[0]; // fr-fr -> fr

            return (I18N[s] && s) || (I18N[primary] && primary) || "en";
        }

        const allowed = new Set(Object.keys(I18N).map(k => k.toLowerCase()));
        const browserLang = detectBrowserLang(allowed);

        // Priority: shortcode lang (if NOT auto) > browser > en

        let initLang = "en";

        const dlRaw = String(defaultLang || "").trim();
        const dl = dlRaw.toLowerCase();

        if (dl && dl !== "auto")
        {
            initLang = resolveLangKey(dlRaw);
        }
        
        else if (browserLang)
        {
            initLang = resolveLangKey(browserLang);
        }

        if (langSelect) langSelect.value = initLang;
        applyLanguage(initLang);
        applyTheme(initTheme);

        setNavButtons();
        updateAboutUi();
        updateProgressUi();

        loadGameFromUrl(gameUrl).catch(showFatal);
    }
})();
