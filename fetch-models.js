/**
 * Model Management and Dropdown Population
 * Fetches available models from OpenRouter API and populates the model selection dropdown
 */

import { DEFAULT_MODEL } from './defaults.js';

// =============================================================================
// MODEL FETCHING AND DROPDOWN POPULATION
// =============================================================================

/**
 * Initialize model dropdown when DOM is ready
 */
document.addEventListener('DOMContentLoaded', function() {
    const modelSelect = document.getElementById('model');

    /**
     * Fetch available models from OpenRouter API
     * Makes authenticated request to get all available AI models
     */
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
            showModelError('Error fetching models. Please check your connection and try again.');
        }
    }

    /**
     * Populate the model dropdown with fetched models
     * @param {Array} models - Array of model objects from OpenRouter API
     */
    function populateModelDropdown(models) {
        // Clear existing options
        modelSelect.innerHTML = '<option value="">Select a model</option>';

        // Sort models alphabetically for easier browsing
        const sortedModels = models.sort((a, b) => a.id.localeCompare(b.id));
        
        // Add all models to dropdown
        sortedModels.forEach(model => {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = model.id;
            
            // Pre-select the default model
            if (model.id === DEFAULT_MODEL) {
                option.selected = true;
            }
            
            modelSelect.appendChild(option);
        });

        // Ensure default model is selected and trigger change event
        modelSelect.value = DEFAULT_MODEL;
        modelSelect.dispatchEvent(new Event('change'));
        
        console.log(`Loaded ${models.length} models, selected: ${DEFAULT_MODEL}`);
    }

    /**
     * Show error message when model fetching fails
     * @param {string} message - Error message to display
     */
    function showModelError(message) {
        const settingsError = document.getElementById('settingsError');
        if (settingsError) {
            settingsError.textContent = message;
            settingsError.classList.remove('hidden');
        }
    }

    // Initialize model fetching
    fetchModels();
});