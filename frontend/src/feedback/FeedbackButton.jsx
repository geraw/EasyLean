import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { captureScreen, imageToDataUrl } from './images';
import { FEEDBACK_URL } from './feedbackUrl';

// The feedback button, and the form it opens. With the student's remarks
// (and the images they paste or attach) it sends, without asking anything
// more, where in the course they are and the state of their work there
// (getContext), and a picture of the screen as it was when they clicked,
// unless they leave it out. Contact details are optional.

const MAX_IMAGES = 6;

const fieldStyle = { width: '100%', boxSizing: 'border-box', padding: '8px', fontSize: '15px', border: '1px solid #aaa', borderRadius: '5px', fontFamily: 'inherit' };
const thumbStyle = { height: '72px', maxWidth: '120px', objectFit: 'cover', border: '1px solid #ccc', borderRadius: '4px', display: 'block' };

const FeedbackForm = ({ context, screenshot, onClose }) => {
    const [comment, setComment] = useState('');
    const [images, setImages] = useState([]);
    const [withScreenshot, setWithScreenshot] = useState(true);
    const [contact, setContact] = useState({ name: '', email: '', phone: '' });
    const [state, setState] = useState('editing'); // editing, sending, sent, failed
    const [notice, setNotice] = useState('');
    const fileInputRef = useRef(null);
    const textRef = useRef(null);

    useEffect(() => textRef.current?.focus(), []);
    useEffect(() => {
        const onKey = (event) => { if (event.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const addImages = async (blobs) => {
        const room = MAX_IMAGES - images.length;
        const files = blobs.filter((blob) => blob.type.startsWith('image/'));
        if (files.length === 0) return;
        if (files.length > room) setNotice(`אפשר לצרף עד ${MAX_IMAGES} תמונות.`);
        const added = [];
        for (const file of files.slice(0, Math.max(0, room))) {
            try {
                const dataUrl = await imageToDataUrl(file);
                if (dataUrl) added.push({ name: file.name || 'image', dataUrl });
                else setNotice('אפשר לצרף תמונות מסוג PNG, JPEG, GIF או WebP.');
            } catch {
                setNotice('לא הצלחנו לקרוא את אחת התמונות.');
            }
        }
        setImages((current) => [...current, ...added].slice(0, MAX_IMAGES));
    };

    const onPaste = (event) => {
        const blobs = [...(event.clipboardData?.items || [])]
            .filter((item) => item.kind === 'file')
            .map((item) => item.getAsFile())
            .filter(Boolean);
        if (blobs.length === 0) return;
        event.preventDefault();
        addImages(blobs);
    };

    const canSend = (comment.trim() || images.length > 0) && state !== 'sending';
    const send = async (event) => {
        event.preventDefault();
        if (!canSend) return;
        setState('sending');
        try {
            await axios.post(`${FEEDBACK_URL}/feedback`, {
                comment: comment.trim(),
                contact: Object.fromEntries(Object.entries(contact).map(([key, value]) => [key, value.trim()])),
                context,
                screenshot: withScreenshot ? screenshot : null,
                images,
            }, { timeout: 30000 });
            setState('sent');
        } catch {
            setState('failed');
        }
    };

    if (state === 'sent') {
        return (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div aria-hidden="true" style={{ fontSize: '48px' }}>🙏</div>
                <h2 style={{ margin: '8px 0' }}>תודה! המשוב נשלח.</h2>
                <p style={{ margin: '0 0 18px 0' }}>כל הערה עוזרת לנו לשפר את האתר.</p>
                <button onClick={onClose} style={{ padding: '10px 24px', fontSize: '16px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>סגירה</button>
            </div>
        );
    }

    return (
        <form onSubmit={send} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h2 style={{ margin: 0 }}>משוב</h2>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span>מה עבד טוב, מה היה מבלבל, מה לא עבד? כל הערה עוזרת.</span>
                <textarea
                    ref={textRef}
                    aria-label="ההערות שלך"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    onPaste={onPaste}
                    rows={5}
                    style={{ ...fieldStyle, resize: 'vertical' }}
                />
            </label>

            <div
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => { event.preventDefault(); addImages([...event.dataTransfer.files]); }}
                style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', border: '1px dashed #aaa', borderRadius: '6px', background: '#fafafa' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={images.length >= MAX_IMAGES}
                        style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #999', background: 'white', cursor: 'pointer' }}>
                        📎 צירוף תמונה
                    </button>
                    <span style={{ fontSize: '13px', color: '#555' }}>או הדביקו תמונה בתיבת ההערות (Ctrl+V), או גררו אותה לכאן.</span>
                    <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" multiple hidden aria-label="צירוף תמונה"
                        onChange={(event) => { addImages([...event.target.files]); event.target.value = ''; }} />
                </div>
                {images.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {images.map((image, index) => (
                            <div key={index} style={{ position: 'relative' }}>
                                <img src={image.dataUrl} alt={`תמונה ${index + 1}`} style={thumbStyle} />
                                <button type="button" aria-label={`הסרת תמונה ${index + 1}`} onClick={() => setImages((current) => current.filter((_, i) => i !== index))}
                                    style={{ position: 'absolute', top: '-8px', insetInlineEnd: '-8px', width: '22px', height: '22px', borderRadius: '50%', border: '1px solid #999', background: 'white', cursor: 'pointer', lineHeight: 1, padding: 0 }}>
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                {notice && <div role="status" style={{ fontSize: '13px', color: '#b3261e' }}>{notice}</div>}
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <label style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', cursor: screenshot ? 'pointer' : 'default', flex: 1 }}>
                    <input type="checkbox" checked={withScreenshot && Boolean(screenshot)} disabled={!screenshot} onChange={(event) => setWithScreenshot(event.target.checked)} />
                    <span>
                        {screenshot ? 'לצרף צילום של המסך' : 'לא הצלחנו לצלם את המסך, אבל אפשר לשלוח בלעדיו.'}
                        <span style={{ display: 'block', fontSize: '13px', color: '#555' }}>
                            יחד עם המשוב יישלחו גם המקום שבו אתם נמצאים ({context.where}) ומצב {context.kind === 'truthTable' ? 'הטבלה' : 'ההוכחה'} כרגע.
                        </span>
                    </span>
                </label>
                {screenshot && <img src={screenshot} alt="צילום המסך" style={{ ...thumbStyle, opacity: withScreenshot ? 1 : 0.35 }} />}
            </div>

            <fieldset style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '10px 12px', margin: 0 }}>
                <legend style={{ padding: '0 6px' }}>פרטי קשר (רשות)</legend>
                <div style={{ fontSize: '13px', color: '#555', marginBottom: '8px' }}>אם תשאירו מייל או טלפון, נוכל לחזור אליכם לגבי המשוב. אפשר גם לשלוח בלי.</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
                    <input aria-label="שם" placeholder="שם" autoComplete="name" value={contact.name} onChange={(event) => setContact({ ...contact, name: event.target.value })} style={fieldStyle} />
                    <input aria-label="מייל" placeholder="מייל" type="email" autoComplete="email" dir="ltr" value={contact.email} onChange={(event) => setContact({ ...contact, email: event.target.value })} style={{ ...fieldStyle, textAlign: 'right' }} />
                    <input aria-label="טלפון" placeholder="טלפון" type="tel" autoComplete="tel" dir="ltr" value={contact.phone} onChange={(event) => setContact({ ...contact, phone: event.target.value })} style={{ ...fieldStyle, textAlign: 'right' }} />
                </div>
            </fieldset>

            {state === 'failed' && <div role="alert" style={{ color: '#b3261e' }}>לא הצלחנו לשלוח את המשוב. נסו שוב בעוד רגע.</div>}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-start' }}>
                <button type="submit" disabled={!canSend}
                    style={{ padding: '10px 24px', fontSize: '16px', background: canSend ? '#4CAF50' : '#bbb', color: 'white', border: 'none', borderRadius: '6px', cursor: canSend ? 'pointer' : 'default' }}>
                    {state === 'sending' ? 'שולח...' : 'שליחה'}
                </button>
                <button type="button" onClick={onClose} style={{ padding: '10px 18px', fontSize: '16px', background: 'white', border: '1px solid #999', borderRadius: '6px', cursor: 'pointer' }}>ביטול</button>
            </div>
        </form>
    );
};

const FeedbackButton = ({ getContext }) => {
    // null when closed; the context and screenshot of the moment the button was clicked.
    const [open, setOpen] = useState(null);
    const [capturing, setCapturing] = useState(false);
    const close = useCallback(() => setOpen(null), []);

    const start = async () => {
        if (capturing) return;
        const context = getContext();
        setCapturing(true);
        const screenshot = await captureScreen();
        setCapturing(false);
        setOpen({ context, screenshot });
    };

    return (
        <>
            <button
                data-feedback-button
                onClick={start}
                disabled={capturing}
                style={{ marginInlineStart: 'auto', alignSelf: 'center', padding: '6px 14px', fontSize: '14px', borderRadius: '16px', border: '1px solid #7a5cc2', background: '#f4efff', color: '#4b2e91', cursor: 'pointer' }}
            >
                {capturing ? 'רגע...' : '💬 משוב'}
            </button>
            {open && (
                // No closing by a click outside, which would lose what was written.
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}
                >
                    <div role="dialog" aria-modal="true" aria-label="משוב"
                        style={{ direction: 'rtl', background: 'white', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', width: 'min(600px, 100%)', maxHeight: '92vh', overflowY: 'auto', boxSizing: 'border-box', padding: '22px 26px' }}>
                        <FeedbackForm context={open.context} screenshot={open.screenshot} onClose={close} />
                    </div>
                </div>
            )}
        </>
    );
};

export default FeedbackButton;
