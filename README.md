# EGF Reader Shortcode – Quick Start Guides

**EGF Reader Shortcode** lets you embed and play **EGF 1.1 interactive games** directly inside WordPress posts or pages using a simple shortcode.  
Upload an `.egf` file to your Media Library, then paste the shortcode with the game URL to display the reader (with optional language + theme controls).

## How to use the plugin

1. Activate the plugin.
2. Upload an `.egf` file to your WordPress **Media Library**.
3. Copy the file URL.
4. Insert the shortcode in any post or page:

### Shortcode parameters

- **`game` (required)**  
  URL of the `.egf` game file to load.

- **`lang` (optional, default: `auto`)**  
  Sets the **interface language** (menus, buttons, labels).  
  - Use **`auto`** to automatically pick the best language from the visitor’s browser (fallback: English).  
  - Or force a specific language using a short code like: `en`, `fr`, `es`, `pt`, `zh`, `ar`, `hi`, `ur`, `ru`.  

- **`theme` (optional, default: `dark`)**  
  Interface theme: `dark` or `light`.

### Example

```text
[egf_reader game="https://your-site.com/wp-content/uploads/game.egf" lang="auto" theme="dark"]
