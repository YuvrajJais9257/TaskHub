exports.getDate = function () {
    return formatDate("long", "numeric", "long");
};

exports.getDay = function () {
    return formatDate("long");
};

function formatDate(weekdayFormat, dayFormat = undefined, monthFormat = undefined) {
    let today = new Date();
    let options = {
        weekday: weekdayFormat,
        day: dayFormat,
        month: monthFormat
    };
    return today.toLocaleDateString("en-US", options);
}
