/*  Copyright 2026 Splamei
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

// -- HTML selectors --

const v2ModeCheck = document.getElementById("v2-mode");
const showMenuWhen = document.getElementById("show-menu");

const discordRpcEnableCheck = document.getElementById("discord-rpc-enable");
const discordRpcDetailsCheck = document.getElementById("discord-rpc-details");

const saveBtn = document.getElementById('save-btn');

// -- Functions --

async function initSettings()
{
    const settings = await window.electronAPI.getSettings();

    v2ModeCheck.checked = settings.v2Mode;
    showMenuWhen.value = settings.showMenu;

    discordRpcEnableCheck.checked = settings.discordRpc;
    discordRpcDetailsCheck.checked = settings.discordRpcDetails;
}

// -- Event listeners --

saveBtn.addEventListener("click", async () => {
    const newSettings = {
        v2Mode: v2ModeCheck.checked,
        showMenu: showMenuWhen.value,

        discordRpc: discordRpcEnableCheck.checked,
        discordRpcDetails: discordRpcDetailsCheck.checked
    };

    const success = await window.electronAPI.saveSettings(newSettings);
    if (!success)
    {
        alert("Something went wrong saving your settings!");
    }

    window.close();
})

initSettings();