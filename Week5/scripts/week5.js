/**
 * Week 5 JavaScript file for Air Quality Predictor
 * Handles project finalization and deployment guidance
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Week 5 page initialized');
    
    // Initialize checklist functionality
    initializeChecklist();
    
    // Update the current date in the footer
    const footer = document.querySelector('footer p');
    const currentYear = new Date().getFullYear();
    if (footer) {
        footer.textContent = `Air Quality Predictor © ${currentYear}`;
    }
});

/**
 * Initialize the project finalization checklist
 */
function initializeChecklist() {
    // Get all checkboxes
    const checkboxes = document.querySelectorAll('.form-check-input');
    
    // Load saved state from localStorage
    const savedChecklist = localStorage.getItem('projectChecklist');
    if (savedChecklist) {
        const checkedItems = JSON.parse(savedChecklist);
        checkboxes.forEach((checkbox, index) => {
            checkbox.checked = checkedItems[index] || false;
        });
    }
    
    // Add event listeners to save state when changed
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', saveChecklistState);
    });
    
    // Update progress indicator
    updateChecklistProgress();
}

/**
 * Save the current state of the checklist to localStorage
 */
function saveChecklistState() {
    const checkboxes = document.querySelectorAll('.form-check-input');
    const checkedItems = Array.from(checkboxes).map(checkbox => checkbox.checked);
    
    localStorage.setItem('projectChecklist', JSON.stringify(checkedItems));
    
    // Update progress indicator
    updateChecklistProgress();
}

/**
 * Update the checklist progress indicator
 */
function updateChecklistProgress() {
    const checkboxes = document.querySelectorAll('.form-check-input');
    const totalItems = checkboxes.length;
    const checkedItems = Array.from(checkboxes).filter(checkbox => checkbox.checked).length;
    
    // Calculate percentage
    const percentage = Math.round((checkedItems / totalItems) * 100);
    
    // Get the card header
    const cardHeader = document.querySelector('.card-header:contains("Project Finalization Checklist")');
    if (cardHeader) {
        // Check if progress indicator exists, create if not
        let progressIndicator = cardHeader.querySelector('.progress');
        if (!progressIndicator) {
            // Create progress indicator
            const progressHtml = `
                <div class="progress mt-2" style="height: 10px;">
                    <div class="progress-bar bg-success" role="progressbar" style="width: ${percentage}%" 
                         aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
                <small class="text-muted">${checkedItems} of ${totalItems} tasks completed (${percentage}%)</small>
            `;
            cardHeader.insertAdjacentHTML('beforeend', progressHtml);
        } else {
            // Update existing progress indicator
            const progressBar = progressIndicator.querySelector('.progress-bar');
            progressBar.style.width = `${percentage}%`;
            progressBar.setAttribute('aria-valuenow', percentage);
            
            const progressText = cardHeader.querySelector('small');
            if (progressText) {
                progressText.textContent = `${checkedItems} of ${totalItems} tasks completed (${percentage}%)`;
            }
        }
    }
}

// Polyfill for :contains selector
if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
}

if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
        var el = this;
        do {
            if (el.matches(s)) return el;
            el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);
        return null;
    };
}

// Helper function to find elements by text content
Document.prototype.querySelector = Document.prototype.querySelector || function() {
    return this.querySelector.apply(this, arguments);
};

NodeList.prototype.forEach = NodeList.prototype.forEach || function(callback, thisArg) {
    thisArg = thisArg || window;
    for (var i = 0; i < this.length; i++) {
        callback.call(thisArg, this[i], i, this);
    }
};

// Add :contains selector
if (!document.querySelector(':contains')) {
    // Use a more compatible approach
    document.querySelector = (function(originalQuerySelector) {
        return function(selector) {
            if (selector.includes(':contains')) {
                // Extract the text to search for
                const match = selector.match(/:contains\("([^"]+)"\)/);
                if (match && match[1]) {
                    const searchText = match[1];
                    const cleanSelector = selector.replace(/:contains\("[^"]+"\)/, '');
                    
                    // Get all elements matching the clean selector
                    const elements = document.querySelectorAll(cleanSelector);
                    
                    // Filter by text content
                    for (let i = 0; i < elements.length; i++) {
                        if (elements[i].textContent.includes(searchText)) {
                            return elements[i];
                        }
                    }
                    return null;
                }
            }
            
            // Fall back to original implementation
            return originalQuerySelector.call(this, selector);
        };
    })(document.querySelector);
}