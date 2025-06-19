document.addEventListener('DOMContentLoaded', function() {
    // Load photos initially
    loadPhotos();
});

function loadPhotos() {
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const gallery = document.getElementById('gallery');
    const noPhotos = document.getElementById('no-photos');
    
    // Show loading state
    loading.style.display = 'block';
    error.style.display = 'none';
    noPhotos.style.display = 'none';
    
    // Replace with your actual API endpoint
    fetch('/api/photos')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch photos');
            }
            return response.json();
        })
        .then(data => {
            loading.style.display = 'none';
            
            if (data.photos && data.photos.length > 0) {
                displayPhotos(data.photos);
            } else {
                noPhotos.style.display = 'block';
            }
        })
        .catch(err => {
            console.error('Error loading photos:', err);
            loading.style.display = 'none';
            error.style.display = 'block';
        });
}

function displayPhotos(photos) {
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = '';
    
    photos.forEach(photo => {
        const photoElement = createPhotoElement(photo);
        gallery.appendChild(photoElement);
    });
}

function createPhotoElement(photo) {
    const photoItem = document.createElement('div');
    photoItem.className = 'photo-item new';
    
    // Extract filename from URL if not provided
    const filename = photo.filename || photo.url.split('/').pop() || 'photo.jpg';
    
    photoItem.innerHTML = `
        <img src="${photo.url}" alt="Beauty standards moment" loading="lazy">
        <div class="photo-info">
            <div class="compliment">"${photo.compliment || photo.transcription || 'A beautiful moment captured'}"</div>
            <div class="timestamp">${formatTimestamp(photo.timestamp)}</div>
            <button class="download-btn" onclick="downloadPhoto('${photo.url}', '${filename}')">
                📥 Download Photo
            </button>
        </div>
    `;
    
    return photoItem;
}

function downloadPhoto(url, filename) {
    // Method 1: Try direct download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Method 2: Fetch and download (for cross-origin images)
    fetch(url)
        .then(response => response.blob())
        .then(blob => {
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up the blob URL
            window.URL.revokeObjectURL(blobUrl);
        })
        .catch(err => {
            console.error('Download failed:', err);
            // Fallback: open in new tab
            window.open(url, '_blank');
        });
}

function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
}
