<?php
/**
 * Plugin Name: EGF Reader Shortcode
 * Description: Embed an EGF 1.1 game reader with a shortcode.
 * Version: 1.0.1
 * Author: The EGF Creator Contributors
 */

if ( !defined('ABSPATH') )
{
    exit;
}

// Allows uploading ".egf" files.
 
add_filter('upload_mimes', function ($mimes)
{
    $mimes['egf'] = 'application/egf+zip';

    return $mimes;
});

// Helps WordPress correctly validate the file extension/MIME type (depending on the server)

add_filter('wp_check_filetype_and_ext', function($data, $file, $filename, $mimes)
{
    $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

    if ($ext === 'egf')
    {
      $data['ext']  = 'egf';
      $data['type'] = 'application/egf+zip';

      if ( !empty($data['proper_filename']) )
      {
        $data['proper_filename'] = $filename;
      }
    }

    return $data;
}, 10, 4);

class EGF_Reader_Shortcode
{
    const HANDLE = 'egf-reader';

    public function __construct()
    {
      add_action('wp_enqueue_scripts', [$this, 'register_assets']);
      add_shortcode('egf_reader', [$this, 'render_shortcode']);
    }

    public function register_assets()
    {
      $base = plugin_dir_url(__FILE__) . 'assets/';
      $ver  = (string) time(); // NO CACHE assets

      wp_register_style(self::HANDLE, $base . 'style.css', [], $ver);
      wp_register_script('egf-jszip', $base . 'jszip.min.js', [], $ver, true);
      wp_register_script('egf-i18n', $base . 'i18n.js', [], $ver, true);
      wp_register_script(self::HANDLE, $base . 'app-wp.js', ['egf-jszip', 'egf-i18n'], $ver, true);
    }

    public function render_shortcode($atts)
    {
      $atts = shortcode_atts([
        'game'    => '',
        'lang'    => 'auto',
        'theme'   => 'light',
        'nocache' => '1',
      ], $atts, 'egf_reader');

      $egf_url = trim((string)$atts['game']);

      if ($egf_url === '')
      {
        return '<div class="notice warn"><b>EGF Reader:</b> missing <code>game</code> attribute (URL of the .egf file).</div>';
      }

      $lang = strtolower(trim((string)$atts['lang']));
      $lang = ($lang === '' ? 'auto' : $lang);

      // If the admin sets an explicit language: keep only letters (e.g., fr-FR -> frfr -> fr)
    
      if ($lang !== 'auto')
      {
          $lang = preg_replace('/[^a-z_-]/i', '', $lang); // fr-FR => fr-FR
          $lang = strtolower($lang);                      // fr-fr
          $lang = $lang ?: 'auto';
      }

      $theme = strtolower(trim((string)$atts['theme']));
      $theme = in_array($theme, ['dark', 'light'], true) ? $theme : 'light';

      $nocache = trim((string)$atts['nocache']);
      $nocache = ($nocache === '' || $nocache === '1' || strtolower($nocache) === 'true') ? '1' : '0';

      wp_enqueue_style(self::HANDLE);
      wp_enqueue_script(self::HANDLE); // deps auto

      $uid = 'egf_' . wp_generate_uuid4();

      ob_start();
      ?>
        <div
          class="egfReaderHost"
          id="<?php echo esc_attr($uid); ?>"
          data-egf-reader="1"
          data-game-url="<?php echo esc_url($egf_url); ?>"
          data-default-lang="<?php echo esc_attr($lang); ?>"
          data-default-theme="<?php echo esc_attr($theme); ?>"
          data-nocache="<?php echo esc_attr($nocache); ?>"
        >
          <?php echo $this->render_markup(); ?>
        </div>
      <?php

      return ob_get_clean();
    }

    private function render_markup()
    {
      ob_start();
      ?>
      <div class="egfReader">
        <header>
          <div class="left">
            <div class="brand">
              <span class="dot"></span>
              <span data-egf="brandTitle"></span>
            </div>
          </div>

          <div class="row">
            <button class="btn secondary" data-egf="btnPause" disabled title="Pause the game / Resume the game">⏸ Pause</button>
            <button class="btn secondary" data-egf="btnScore" disabled title="View score">🏆 Score</button>
            <button class="btn secondary" data-egf="btnAbout" title="View game info">ℹ️ About the game</button>
            <button class="btn secondary" data-egf="btnSettings" title="Open Settings">⚙️ Settings</button>
          </div>
        </header>

        <main>
          <section class="card">
            <div class="hd">
              <div class="sceneTitle" style="min-width:0">
                <div class="t" data-egf="sceneName">Loading…</div>
                <div class="s" data-egf="sceneSub">Please wait.</div>
              </div>

              <div class="progress" data-egf="rolePill" style="display:none" title="Game progression">
                <span data-egf="roleProgressText">0%</span>
                <span class="bar"><i data-egf="roleBarFill"></i></span>
              </div>
            </div>

            <div class="sceneWrap" data-egf="sceneWrap">
              <div class="pauseOverlay" data-egf="pauseOverlay" aria-hidden="true">
                <div class="pausePanel">
                  <h3>⏸ Game paused</h3>
                  <p>Audio and video are paused, and interactions are disabled.</p>
                  <div class="row" style="justify-content:center">
                    <button class="btn good" data-egf="btnResumeOverlay">▶ Resume</button>
                  </div>
                </div>
              </div>

              <div class="content" data-egf="sceneContent">
                <div class="textBlock muted">Loading…</div>
              </div>

              <div class="footerActions" data-egf="sceneFooter"></div>
            </div>
          </section>
        </main>

        <!-- ABOUT MODAL -->
        <div data-egf="aboutModal" class="modal" aria-hidden="true">
          <div class="backdrop" data-egf="aboutBackdrop"></div>
          <div class="panel" role="dialog" aria-modal="true" aria-label="About the game">
            <div class="panelHd">
              <div class="title"><span>ℹ️ About the game</span></div>
              <div class="row">
                <button class="btn secondary" data-egf="btnCloseAbout" title="Close">✕</button>
              </div>
            </div>
            <div class="panelBd">
              <div class="notice" data-egf="warnings" style="display:none"></div>

              <div class="aboutCoverWrap" data-egf="aboutCoverWrap" style="display:none">
                <img data-egf="aboutCover" class="aboutCoverImg" alt="EGF cover">
              </div>

              <div class="notice neutral">
                <div class="kv" style="margin-top:0">
                  <div class="k">Game name</div><div class="v" data-egf="kvTitle">—</div>
                  <div class="k">Creator</div><div class="v" data-egf="kvCreator">—</div>
                  <div class="k">Description</div><div class="v" data-egf="kvDesc">—</div>
                  <div class="k">Creation / publication date</div><div class="v" data-egf="kvDate">—</div>
                  <div class="k">Last modified date</div><div class="v" data-egf="kvModified">—</div>
                  <div class="k">EGF Version</div><div class="v" data-egf="kvVer">—</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- SETTINGS MODAL -->
        <div data-egf="settingsModal" class="modal" aria-hidden="true">
          <div class="backdrop" data-egf="settingsBackdrop"></div>
          <div class="panel" role="dialog" aria-modal="true" aria-label="Audio settings">
            <div class="panelHd">
              <div class="title"><span>⚙️ Settings</span></div>
              <div class="row">
                <button class="btn secondary" data-egf="btnCloseSettings" title="Close">✕</button>
              </div>
            </div>

            <div class="panelBd">
              <div class="settingsGrid">
                <div class="settingsRow">
                  <div class="left">
                    <div class="name">Background volume</div>
                    <div class="hint">Controls background sounds (background audio).</div>
                  </div>
                  <div class="right">
                    <input data-egf="bgVol" type="range" min="0" max="100" step="1" value="75" />
                    <div class="pct" data-egf="bgVolPct">75%</div>
                    <label class="toggle" title="Mute/unmute background audio">
                      <input data-egf="bgMute" type="checkbox" />
                      <span>Mute</span>
                    </label>
                  </div>
                </div>

                <div class="settingsRow">
                  <div class="left">
                    <div class="name">Foreground audio volume</div>
                    <div class="hint">Controls foreground sounds (foreground audio).</div>
                  </div>
                  <div class="right">
                    <input data-egf="fgVol" type="range" min="0" max="100" step="1" value="100" />
                    <div class="pct" data-egf="fgVolPct">100%</div>
                    <label class="toggle" title="Mute/unmute foreground audios">
                      <input data-egf="fgMute" type="checkbox" />
                      <span>Mute</span>
                    </label>
                  </div>
                </div>
              </div>

              <div class="settingsRow">
                <div class="left">
                  <div class="name">Theme</div>
                  <div class="hint">Toggle between dark mode and light mode.</div>
                </div>
                <div class="right">
                  <label class="toggle" title="Toggle dark/light mode">
                    <input data-egf="themeToggle" type="checkbox" />
                    <span>Dark mode</span>
                  </label>
                </div>
              </div>

              <div class="settingsRow">
                <div class="left">
                  <div class="name" data-egf="langLabel">Language</div>
                  <div class="hint" data-egf="langHint">Choose the interface language.</div>
                </div>
                <div class="right">
                  <select data-egf="langSelect" class="textInput" style="max-width:260px">
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                    <option value="es">Español</option>
                    <option value="pt">Português</option>
                    <option value="zh">中文（普通话）</option>
                    <option value="ar">العربية (الفصحى الحديثة)</option>
                    <option value="hi">हिंदी</option>
                    <option value="ur">اردو</option>
                    <option value="ru">Русский</option>
                  </select>
                </div>
              </div>

              <div class="settingsRow">
                <div class="left">
                  <div class="name">Reset</div>
                  <div class="hint">Reset the session (score, progress) and return to the title screen.</div>
                </div>
                <div class="right">
                  <button class="btn secondary" data-egf="btnReset" disabled title="Reset session">Reset</button>
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- SCORE MODAL -->
        <div data-egf="scoreModal" class="modal" aria-hidden="true">
          <div class="backdrop" data-egf="scoreBackdrop"></div>
          <div class="panel" role="dialog" aria-modal="true" aria-label="Score and debug">
            <div class="panelHd">
              <div class="title"><span>🏆 Score</span></div>
              <div class="row">
                <button class="btn secondary" data-egf="btnCloseScore" title="Close">✕</button>
              </div>
            </div>

            <div class="panelBd">
              <div class="notice neutral">
                <div class="kv" style="margin-top:0">
                  <div class="k">Current scene</div><div class="v" data-egf="kvCurrentScene">—</div>
                  <div class="k">Current scene ID</div><div class="v" data-egf="kvCurrentSceneId">—</div>
                  <div class="k">Current scene role</div><div class="v" data-egf="kvCurrentRole">—</div>
                  <div class="k">Wrong answers count</div><div class="v" data-egf="kvWrong">—</div>
                  <div class="k">Game progression</div>
                  <div class="v noClip">
                    <span class="scoreProgressPct" data-egf="scoreProgressPct">0%</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
      <?php

      return ob_get_clean();
    }
}

new EGF_Reader_Shortcode();
