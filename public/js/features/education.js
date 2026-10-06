/** Accordion of digital-literacy tips: at most one item open at a time. */
export function initEducation() {
    const items = document.querySelectorAll('.accordion-item');

    document.querySelectorAll('.accordion-trigger').forEach((trigger) => {
        trigger.addEventListener('click', () => {
            const item = trigger.parentElement;
            const wasOpen = item.classList.contains('active');
            items.forEach((other) => other.classList.remove('active'));
            item.classList.toggle('active', !wasOpen);
        });
    });
}
