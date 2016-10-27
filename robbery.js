'use strict';

exports.isStar = true;

var DayCast = {
    'ПН': 17,
    'ВТ': 18,
    'СР': 19
};

var InvertDayCast = {
    1: 'ПН',
    2: 'ВТ',
    3: 'СР'
};

var BankGMT;

function convertToDate(time) {
    var match = /([а-я]{2})\s(\d{2}:\d{2})([+-]\d+)/gi.exec(time);

    return match !== null ? new Date('October ' + DayCast[match[1]] +
            ', 2016 ' + match[2] + ':00 GMT' + match[3] + '00') : time;
}

function transfromSchedule(buddy, schedule, newSchedule) {
    for (var i = 0; i < schedule[buddy].length; i++) {
        newSchedule.push(
            {
                from: convertToDate(schedule[buddy][i].from),
                to: convertToDate(schedule[buddy][i].to)
            });
    }

    return newSchedule;
}

function convertSchedule(schedule) {
    var newSchedule = [];
    for (var buddy in schedule) {
        if ({}.hasOwnProperty.call(schedule, buddy)) {
            newSchedule = transfromSchedule(buddy, schedule, newSchedule);
        }
    }
    newSchedule.sort(compareTime);

    return newSchedule;
}

function convertWorkingHours(workingHours) {
    var matchFrom = /(\d{2}:\d{2})([+-]\d+)/gi.exec(workingHours.from);
    var matchTo = /(\d{2}:\d{2})([+-]\d+)/gi.exec(workingHours.to);
    BankGMT = matchFrom[2];
    var newWorkingHours = [];
    for (var i = 0; i < 3; i++) {
        newWorkingHours.push(
            {
                from: new Date('October ' + (17 + i) +
                    ', 2016 ' + matchFrom[1] + ':00 GMT' + matchFrom[2] + '00'),
                to: new Date('October ' + (17 + i) +
                    ', 2016 ' + matchTo[1] + ':00 GMT' + matchTo[2] + '00')
            });
    }

    return newWorkingHours;
}

function compareTime(first, second) {
    return first.from - second.from;
}

function getNewCurrent(schedule, time) {
    var newCurrent = new Date(1970);
    schedule.forEach(function (prevTime) {
        if (prevTime.to >= time.to && prevTime.from <= time.to) {
            newCurrent = new Date(Math.max(newCurrent, prevTime.to));
        }
    });

    return newCurrent;
}

function getFreeMoments(schedule) {
    var freeMoments = [];
    var currentTime = new Date(2016, 9, 17, 0, 0, 0);
    var robEnd = new Date(2016, 9, 19, 23, 59, 0);
    schedule.forEach(function (time) {
        if (time.from > currentTime) {
            freeMoments.push(
                {
                    from: currentTime, to: time.from
                });
            currentTime = getNewCurrent(schedule, time);
        }
    });
    if (currentTime < robEnd) {
        freeMoments.push(
            {
                from: currentTime,
                to: robEnd
            });
    }

    return freeMoments;
}

function getApprMomentDaySame(time, duration, workingHours) {
    if (time.from < workingHours[time.from.getDay() - 1].from) {
        time.from = workingHours[time.from.getDay() - 1].from;
    }
    if (time.to > workingHours[time.to.getDay() - 1].to) {
        time.to = workingHours[time.to.getDay() - 1].to;
    }

    return time.to - time.from >= duration ? {
        from: time.from, to: time.to
    } : null;
}

function getApprMomentDayDiff(time, duration, workingHours) {
    var apprMoments = [];
    if (time.from < workingHours[time.from.getDay() - 1].from) {
        time.from = workingHours[time.from.getDay() - 1].from;
    }
    if (workingHours[time.from.getDay() - 1].to - time.from >= duration) {
        apprMoments.push(
            {
                from: time.from, to: workingHours[time.from.getDay() - 1].to
            }
        );
    } else {
        apprMoments.push(null);
    }
    if (Math.min(time.to, workingHours[time.to.getDay() - 1].to) -
        workingHours[time.to.getDay() - 1].from >= duration) {
        apprMoments.push(
            {
                from: workingHours[time.to.getDay() - 1].from,
                to: new Date(Math.min(time.to, workingHours[time.to.getDay() - 1].to))
            }
        );
    } else {
        apprMoments.push(null);
    }

    return apprMoments;
}

function getApprMomentDay2Diff(time, duration, workingHours) {
    var apprMoments = [];
    if (time.from < workingHours[time.from.getDay() - 1].from) {
        time.from = workingHours[time.from.getDay() - 1].from;
    }
    if (workingHours[time.from.getDay() - 1].to - time.from >= duration) {
        apprMoments.push(
            {
                from: time.from, to: workingHours[time.from.getDay() - 1].to
            }
        );
    } else {
        apprMoments.push(null);
    }
    apprMoments.push({
        from: workingHours[time.to.getDay() - 2].from,
        to: workingHours[time.to.getDay() - 2].to
    });
    if (time.to - workingHours[time.to.getDay() - 1].from >= duration) {
        apprMoments.push(
            {
                from: workingHours[time.to.getDay() - 1].from,
                to: new Date(Math.min(time.to, workingHours[time.to.getDay() - 1].to))
            }
        );
    } else {
        apprMoments.push(null);
    }

    return apprMoments;
}

function getApprMoments(freeMoments, duration, workingHours) {
    var apprMoments = [];
    var apprMoment;
    freeMoments.forEach(function (time) {
        if (time.from.getDay() === time.to.getDay()) {
            apprMoment = getApprMomentDaySame(time, duration, workingHours);
            if (apprMoment) {
                apprMoments.push(apprMoment);
            }
        }
        if (time.from.getDay() === time.to.getDay() - 1) {
            apprMoment = getApprMomentDayDiff(time, duration, workingHours);
            apprMoment.forEach(function (thing) {
                if (thing) {
                    apprMoments.push(thing);
                }
            });
        }
        if (time.from.getDay() === time.to.getDay() - 2) {
            apprMoment = getApprMomentDay2Diff(time, duration, workingHours);
            apprMoment.forEach(function (thing) {
                if (thing) {
                    apprMoments.push(thing);
                }
            });
        }
    });

    return apprMoments;
}

function transfromInTwoDig(number) {
    if (number <= 9) {

        return '0' + number;
    }

    return number;
}

function formatTemplate(apprMoment, template) {
    var hourInMs = 60 * 60 * 1000;
    var apprOffset = apprMoment.from.getTimezoneOffset() / -60 * hourInMs;
    var bankOffset = Number(BankGMT) * hourInMs;
    var time = new Date(apprMoment.from - apprOffset + bankOffset);

    return template
        .replace('%DD', InvertDayCast[time.getDay()])
        .replace('%HH', transfromInTwoDig(time.getHours()))
        .replace('%MM', transfromInTwoDig(time.getMinutes()));
}

exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    schedule = convertSchedule(schedule);
    workingHours = convertWorkingHours(workingHours);
    var freeMoments = getFreeMoments(schedule);
    duration = duration * 60 * 1000;
    var apprMoments = getApprMoments(freeMoments, duration, workingHours);
    var pointer = 0;

    return {

        exists: function () {
            return apprMoments.length > 0;
        },

        format: function (template) {
            return apprMoments.length > 0 ? formatTemplate(apprMoments[pointer], template) : '';
        },
        tryLater: function () {
            if (apprMoments.length === 0) {
                return false;
            }
            var currentMoment = apprMoments[pointer].from.getTime();
            currentMoment += 1800000;
            if (apprMoments[pointer].to.getTime() - currentMoment >= duration) {
                apprMoments[pointer].from = new Date(currentMoment);

                return true;
            }
            var oldPointer = pointer;
            while (apprMoments[pointer].from - apprMoments[oldPointer].from < 1800000) {
                if (pointer < apprMoments.length - 1) {
                    pointer++;
                } else {
                    return false;
                }
            }

            return true;
        }
    };
};

