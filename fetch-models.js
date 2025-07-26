import { DEFAULT_MODEL } from './defaults.js';

document.addEventListener('DOMContentLoaded', function() {
    const modelSelect = document.getElementById('model');

    // Fetch and populate models
    async function fetchModels() {
        try {
            const response = await fetch("https://openrouter.ai/api/v1/models", {
                headers: {
                    "HTTP-Referer": window.location.href,
                    "X-Title": "Chat App"
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            populateModelDropdown(data.data);
        } catch (error) {
            console.error('Error fetching models:', error);
            const settingsError = document.getElementById('settingsError');
            if (settingsError) {
                settingsError.textContent = 'Error fetching models. Please check your API key and try again.';
            }
        }
    }

    function populateModelDropdown(models) {
        // Clear existing options
        modelSelect.innerHTML = '<option value="">Select a model</option>';

        // Sort all models alphabetically
        const sortedModels = models.sort((a, b) => a.id.localeCompare(b.id));
        
        // Add all models in alphabetical order
        sortedModels.forEach(model => {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = model.id;
            // Set default selection to DEFAULT_MODEL
            if (model.id === DEFAULT_MODEL) {
                option.selected = true;
            }
            modelSelect.appendChild(option);
        });

        // Set default model and trigger change event
        modelSelect.value = DEFAULT_MODEL;
        modelSelect.dispatchEvent(new Event('change'));
    }


    // Call fetchModels when the page loads
    fetchModels();
});
