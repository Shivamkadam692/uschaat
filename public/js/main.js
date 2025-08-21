// Main JavaScript file for client-side functionality

// Initialize tooltips and popovers if using Bootstrap
document.addEventListener('DOMContentLoaded', function() {
  // Initialize Bootstrap tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });

  // Initialize Bootstrap popovers
  const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
  popoverTriggerList.map(function (popoverTriggerEl) {
    return new bootstrap.Popover(popoverTriggerEl);
  });
});

// Add active class to current conversation
function setActiveConversation(element) {
  // Remove active class from all conversations
  document.querySelectorAll('.conversation-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // Add active class to clicked conversation
  if (element) {
    element.classList.add('active');
  }
}

// Format timestamp to readable format
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  
  // If today, show only time
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // If this year, show month and day
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  
  // Otherwise show full date
  return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
}

// Format last seen status
function formatLastSeen(timestamp) {
  if (!timestamp) return 'Never online';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  }
}

// Handle form validation
function validateForm(formId) {
  const form = document.getElementById(formId);
  
  if (!form) return true;
  
  let isValid = true;
  const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
  
  inputs.forEach(input => {
    if (!input.value.trim()) {
      input.classList.add('is-invalid');
      isValid = false;
    } else {
      input.classList.remove('is-invalid');
    }
  });
  
  return isValid;
}

// Add event listeners to forms
document.addEventListener('DOMContentLoaded', function() {
  const forms = document.querySelectorAll('form');
  
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      if (!validateForm(form.id)) {
        e.preventDefault();
      }
    });
  });

  // Mobile: toggle conversations sidebar
  const convToggle = document.getElementById('convToggle');
  const convCol = document.querySelector('.conversations-col');
  const overlay = document.createElement('div');
  overlay.className = 'mobile-overlay d-none';
  document.body.appendChild(overlay);

  function openConversations() {
    if (convCol) convCol.classList.add('open');
    overlay.classList.remove('d-none');
  }

  function closeConversations() {
    if (convCol) convCol.classList.remove('open');
    overlay.classList.add('d-none');
  }

  convToggle?.addEventListener('click', function() {
    if (convCol && convCol.classList.contains('open')) closeConversations();
    else openConversations();
  });

  const convFloating = document.getElementById('convFloating');
  convFloating?.addEventListener('click', function() {
    openConversations();
  });

  overlay.addEventListener('click', closeConversations);
});