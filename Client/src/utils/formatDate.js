export function formatDateOrRelative(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    const diffYear = now.getFullYear() - date.getFullYear();

    if (diffYear >= 1) {
        // Format: month day, year
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const optionsFrench = { year: 'numeric', month: 'long', day: 'numeric', locale: 'fr-FR' };
        return date.toLocaleDateString('fr-FR', optionsFrench);
    } else if (diffDay >= 1) {
        // Format: day/month hour:minute
        const optionsFrenchDayMonth = { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' };
        return date.toLocaleDateString('fr-FR', optionsFrenchDayMonth);
    } else if (diffHour >= 1) {
        return `${diffHour}h`;
    } else if (diffMin >= 1) {
        return `${diffMin}min`;
    } else {
        return 'À l\'instant';
    }
}