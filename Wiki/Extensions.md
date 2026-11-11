
# Extensions

## Extension rundown

Extensions, well, extend the functionally of the client and Rhythm Plus game by adding things that wouldn't be possible otherwise, like custom skins, multiplayer and a leaderboard. This wiki page will guide you through adding an extension to the client and how to use it.

> [!IMPORTANT]  
>  Extensions have full access to the Rhythm Plus game, so be careful when adding some as it could compromise your device or result in your account being banned. Only use extensions from those you trust

## Finding extensions

Before you add an extension, you'll need it's files. This is because there is no extension store for the client, so you'll have to download their unpackaged form. This should be a folder, containing a `manifest.json` file inside. If you've got your extension, you're ready to add it!

### Where can I find extensions?

One of the best places to find extensions is the official Rhythm Plus Discord server, where people sometimes post their extensions for the game. Though these extensions are mainly made for Google Chrome, they'll still work on the client (It does run Chromium after all!)

You could also find open-sourced extensions on GitHub or Codeberg too by searching for them. Just look for extensions targeting the Rhythm Plus music game and made for Chrome or Chromium (Firefox extensions won't work!)

## Adding an extension

Once you have your extension, it's time to add it!
1. Navigate to the extensions directory
   - You can do this by opening the client and going `Extensions > Open extension folder`
   - You can also go to the path directly:
	   - Windows: `%AppData%/rplus-splamei-client-pc/Extensions`
	   - Linux: `~/.config/rplus-splamei-client-pc/Extensions`
2. Copy your extension into this folder
   - Make sure `manifest.json` is directly inside the folder!
3. Restart the client to apply

That's it! The client should now load and use the extension. You should be able to see it within the `Extension` menu now. If the extension is clickable, a window should appear but not all extensions support it.

## Removing an extension

Adding an extension is just as simple as removing one. Just close the client, navigate to the extension folder (listed above), delete the folder for the extension you want to remove, relaunch the client and it's gone!

## Opening an extension

Extensions will always run in the background when the client is open, so you won't need to start them manually. However, some extensions have menus for settings or statistics on them. Their menu can be opened by selecting their name in the `Extensions` menu when the client is open. This will show their menu in a separate window.

## Extension safety

Like when running executables, extensions have full access to the Rhythm Plus game and may have further access to the system. Because of this, you need to be careful with the extensions you add because it may compromise your Rhythm Plus account, other accounts, or your system. Only use extensions from those you trust, make sure you have an active anti-virus active, your system is up-to-date and follow the latest security practices.
