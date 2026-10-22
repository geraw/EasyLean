import { domToJpeg } from 'modern-screenshot';

// Images for feedback: a picture of the screen, and the images a student
// pastes or attaches, kept small enough to send (the server takes up to
// MAX_IMAGE_BYTES each, see feedback/server.js).

const MAX_SIDE = 1600;
const KEEP_AS_IS_BYTES = 1.5 * 1024 * 1024;
const TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

const readAsDataUrl = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
});

const loadImage = (src) => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
});

// A data URL of the image: as it is when it is small, otherwise redrawn as a
// JPEG at most MAX_SIDE pixels wide and high. Null for what is not an image.
export const imageToDataUrl = async (blob) => {
    if (!TYPES.includes(blob.type)) return null;
    const dataUrl = await readAsDataUrl(blob);
    const image = await loadImage(dataUrl);
    if (blob.size <= KEEP_AS_IS_BYTES && Math.max(image.width, image.height) <= MAX_SIDE) return dataUrl;
    const scale = Math.min(1, MAX_SIDE / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    const context = canvas.getContext('2d');
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
};

// Left out of the picture: the feedback button, and Blockly's zoom buttons
// and trash can, whose images come out broken.
const kept = (node) => !(node.dataset?.feedbackButton !== undefined
    || node.classList?.contains('blocklyZoom') || node.classList?.contains('blocklyTrash'));

// The window as the student sees it, as a JPEG data URL, or null if it could
// not be drawn.
export const captureScreen = async () => {
    try {
        // The copy that is drawn shows a menu's chosen option (the level) by its attribute.
        document.querySelectorAll('option').forEach((option) => option.toggleAttribute('selected', option.selected));
        const width = document.documentElement.clientWidth;
        const height = document.documentElement.clientHeight;
        return await domToJpeg(document.body, {
            width, height, quality: 0.8,
            scale: Math.min(window.devicePixelRatio || 1, MAX_SIDE / width),
            backgroundColor: '#f0f2f5',
            timeout: 8000,
            filter: kept,
            // Panels scrolled as the student left them.
            features: { restoreScrollPosition: true },
        });
    } catch (error) {
        console.error('Could not take a screenshot for feedback', error);
        return null;
    }
};
