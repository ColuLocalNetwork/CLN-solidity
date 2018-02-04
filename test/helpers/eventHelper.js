let _ = require("lodash");

module.exports = {
    assertEvent: function(contract, filter) {
        return new Promise((resolve, reject) => {
            let event = contract[filter.event]();
            event.watch();
            event.get((error, logs) => {
                let log = _.filter(logs, filter);
                if (log) {
                    resolve(log);
                } else {
                    throw Error("Failed to find filtered event for " + filter.event);
                }
            });
            event.stopWatching();
        });
    }
}