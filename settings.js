// -- HTML selectors --

const v2ModeCheck = document.getElementById("v2-mode");
const showMenuWhen = document.getElementById("show-menu");

const saveBtn = document.getElementById('save-btn');

// -- Functions --

async function initSettings()
{
    const settings = await window.electronAPI.getSettings();

    v2ModeCheck.checked = settings.v2Mode;
    showMenuWhen.value = settings.showMenu;
}

// -- Event listeners --

saveBtn.addEventListener("click", async () => {
    const newSettings = {
        v2Mode: v2ModeCheck.checked,
        showMenu: showMenuWhen.value
    };

    const success = await window.electronAPI.saveSettings(newSettings);
    if (!success)
    {
        alert("Something went wrong saving your settings!");
    }

    window.close();
})

initSettings();