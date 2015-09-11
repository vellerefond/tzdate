(function() {
	var tz = 0, isEnabled = true, tzDate = {}, globals = { dateSeparator: '/' };

	/* START - HELPER FUNCTIONS */

	/* take the initially passed time argument (toUTZ / toUTC) and return a string */

	function timeToString(time) {
		switch (typeof (time)) {
			case 'undefined':
				return null;
			case 'string':
				try {
					time = new DOMParser().parseFromString(time, 'text/xml').children[0].textContent;
				} catch (exception) {}
				finally {
					time = time.trim().replace(/\s(GMT|UTC).*$/i, '');
				}
				break;
			case 'object':
				if (typeof HTMLElement !== 'undefined' && time instanceof HTMLElement)
					time = time.textContent.trim().replace(/\s(GMT|UTC).*$/i, '');
				else if (time instanceof Date)
					time = time.getFullYear() + '/' + prepend0(time.getMonth() + 1) + '/' + prepend0(time.getDate()) + ' '
						+ prepend0(time.getHours()) + ':' + prepend0(time.getMinutes()) + ':' + prepend0(time.getSeconds());
				break;
			case 'function':
				time = time();
				if (typeof (time) === 'function')
					return null;
				time = timeToString(time);
				break;
			default:
				time = time.toString().trim().replace(/\s(GMT|UTC).*$/i, '');
		}

		if (time === '')
			return null;

		return time;
	}

	/* minutes to milliseconds */

	function min2mil(min) {
		return min * 60 * 1000;
	}

	/* "x" -> "0x" | "xx" -> "xx" */

	function prepend0(str) {
		if (typeof (str) === 'undefined')
			return '00';
		str = str.toString();
		if (str.length === 1)
			return '0' + str;
		return str;
	}

	/* formats the users preferred time zone taking into account whether DST is in effect */

	function formatTZ(date, _tz, showDST) {
		_tz = _tz || tz;

		var
			isDST = showDST && date.isDST(),
			isMinus = _tz < 0,
			tzOver60String = (Math.abs(_tz) / 60).toString(),
			hoursOffset = prepend0(parseInt(tzOver60String).toString()),
			minutesOffset = "00"
		;

		if (/\./.test(tzOver60String))
			minutesOffset = prepend0(parseInt((parseFloat(tzOver60String.substr(tzOver60String.indexOf("."))) * 60).toString()).toString());

		return 'UTC' + (_tz === 0 ? '' : ((!isMinus ? '+' : '-') + prepend0(hoursOffset) + prepend0(minutesOffset)) + (isDST ? ' (DST)' : ''));
	};

	/* END - HELPER FUNCTIONS */

	tzDate.setOptions = function(options) {
		if (Object.prototype.toString.call(options) !== '[object Object]')
			return;
		for (var key in options)
			if (key in globals)
				globals[key] = options[key];
	}

	tzDate.enabled = function(enabled) {
		if (typeof (enabled) === 'boolean')
			return isEnabled = enabled;
		return isEnabled;
	};

	tzDate.tz = function(_tz) {
		if (typeof (tz) === 'number')
			return tz = _tz;
		return tz;
	};

	tzDate.now = function(nowDate) {
		var local = nowDate instanceof Date ? nowDate : new Date(),
			utc = new Date(local.getTime()),
			tzd = new Date(local.getTime());
		if (isEnabled) {
			utc.setTime(utc.getTime() + (utc.getTimezoneOffset() * 60000));
			tzd.setTime(utz.getTime() + (tzd.getTimezoneOffset() * 60000) + (tz * 60000));
		}
		return { local: local, utc: utc, tzd: tzd };
	};

	/*
	 * converts from UTC time to the preferred timezone time
	 * options.format: one of { timestamp, date, time, datetime }
	 * options.onMismatch: one of { tooltip, icon }
	 */

	tzDate.toTZ = function (time, options, _tz) {
		var timespec = time;

		time = timeToString(time);

		if (time === null)
			return null;

		options = options || {};

		_tz = _tz || tz;

		if (!isEnabled) {
			_tz = 0;
			options.showMismatch = false;
		}

		var
			showTZ,
			showSeconds = typeof (options.showSeconds) !== 'undefined' ? options.showSeconds : true,
			showMismatch = typeof (options.showMismatch) !== 'undefined' ? options.showMismatch : false,
			reformatOnly = typeof (options.reformatOnly) !== 'undefined' ? options.reformatOnly : false,
			onMismatch,
			isTimestamp,
			date,
			timeZoneMilliseconds = min2mil(_tz),
			dateSeparator = options.dateSeparator || globals.dateSeparator,
			utcDate, utcMonth, utcYear,
			utcHours, utcMinutes, utcSeconds,
			tzTime
		;

		isTimestamp = /^-?[0-9]+(?:\.[0-9]+)?$/.test(time);

		if (isTimestamp) {
			date = new Date(parseInt(time) + (!reformatOnly ? timeZoneMilliseconds : 0));
		} else {
			if (/^[0-9\-]+t[0-9\:]+$/i.test(time))
				time = time.replace(/t/i, ' ').replace(/-/g, '/');

			if (/\//g.test(time))
				dateSeparator = '/';
			else if (/-/g.test(time))
				time = time.replace(/-/g, '/');

			date = new Date(time);
			date.setTime((date.getTime() - min2mil(date.getTimezoneOffset())) + (!reformatOnly ? timeZoneMilliseconds : 0));
		}

		if (isNaN(date.getFullYear()))
			return timespec;

		switch (options.format) {
			case 'timestamp':
				showMismatch = false;
				tzTime = date.getTime();
				break;
			case 'date':
				showTZ = typeof (options.showTZ) !== 'undefined' ? options.showTZ : false;
				onMismatch = typeof (options.onMismatch) !== 'undefined' ? options.onMismatch : 'tooltip';
				utcDate = prepend0(date.getUTCDate());
				utcMonth = prepend0(date.getUTCMonth() + 1);
				utcYear = prepend0(date.getUTCFullYear());
				tzTime = utcYear + dateSeparator + utcMonth + dateSeparator + utcDate + (showTZ ? ' ' + formatTZ(date, _tz, false) : '');
				break;
			case 'time':
				showTZ = typeof (options.showTZ) !== 'undefined' ? options.showTZ : true;
				onMismatch = typeof (options.onMismatch) !== 'undefined' ? options.onMismatch : 'icon';
				utcHours = prepend0(date.getUTCHours());
				utcMinutes = prepend0(date.getUTCMinutes());
				utcSeconds = prepend0(date.getUTCSeconds());
				tzTime = utcHours + ':' + utcMinutes + (showSeconds ? ':' + utcSeconds : '') + (showTZ ? ' ' + formatTZ(date, _tz, false) : '');
				break;
			case 'datetime':
			default:
				showTZ = typeof (options.showTZ) !== 'undefined' ? options.showTZ : false;
				onMismatch = typeof (options.onMismatch) !== 'undefined' ? options.onMismatch : 'tooltip';
				utcDate = prepend0(date.getUTCDate());
				utcMonth = prepend0(date.getUTCMonth() + 1);
				utcYear = prepend0(date.getUTCFullYear());
				utcHours = prepend0(date.getUTCHours());
				utcMinutes = prepend0(date.getUTCMinutes());
				utcSeconds = prepend0(date.getUTCSeconds());
				tzTime = utcYear + dateSeparator + utcMonth + dateSeparator + utcDate + ' '
					+ utcHours + ':' + utcMinutes + (showSeconds ? ':' + utcSeconds : '')
					+ (showTZ ? ' ' + formatTZ(date, _tz, false) : '');
		}

		if (showMismatch && _tz !== -(new Date().getTimezoneOffset())) {
			switch (onMismatch) {
				case 'icon':
					//tzTime = '<span class="icon icon-info-gray timezone" title="' + $z.i18n.UserLocalTimezoneMismatch + '"></span>' + tzTime;
					break;
				case 'tooltip':
				default:
					//utzTime = '<span title="' + (options.initialTooltip ? options.initialTooltip + '\n\n' : '') + $z.i18n.UserLocalTimezoneMismatch + '">' + //utzTime + '</span>';
			}
		}

		return tzTime;
	};

	/*
	 * converts from the preferred timezone time to UTC time
	 * options.format: one of {timestamp, isostring}
	 * options.selection: one of {date, time, datetime}
	 */

	tzDate.toUTC = function (time, options, _tz) {
		var timespec = time;

		time = timeToString(time);

		if (time === null)
			return null;

		options = options || {};

		_tz = _tz || tz;

		if (!isEnabled) {
			_tz = 0;
			options.showMismatch = false;
		}

		var
			isTimestamp,
			date,
			timeZoneMilliseconds = min2mil(utz),
			dateSeparator = options.dateSeparator || globals.dateSeparator,
			tzDate, tzMonth, tzYear,
			tzHours, tzMinutes, tzSeconds,
			utcTime
		;

		isTimestamp = /^-?[0-9]+(?:\.[0-9]+)?$/.test(time);

		if (isTimestamp && typeof (options.format) === 'undefined') {
			if (options.tzTimestamp)
				return this.toTZ(
					this.toUTC(
						this.toTZ(parseInt(time),	{ reformatOnly: true, showMismatch: false })
					),
					{ reformatOnly: true, showMismatch: false, format: 'timestamp' }
				);
			return parseInt(time);
		} else {
			if (/\//g.test(time))
				dateSeparator = '/';
			else if (/-/g.test(time))
				time = time.replace(/-/g, '/');

			date = new Date(isTimestamp ? parseInt(time) : time);
			date.setTime(date.getTime() - timeZoneMilliseconds);
		}

		if (isNaN(date.getFullYear()))
			return timespec;

		switch (options.format) {
			case 'timestamp':
				utcTime = date.getTime();
				break;
			case 'string':
			default:
				switch (options.selection) {
					case 'time':
						tzHours = prepend0(date.getHours());
						tzMinutes = prepend0(date.getMinutes());
						tzSeconds = prepend0(date.getSeconds());
						utcTime = tzHours + ':' + tzMinutes + ':' + tzSeconds;
						break;
					case 'date':
						tzDate = prepend0(date.getDate());
						tzMonth = prepend0(date.getMonth() + 1);
						tzYear = prepend0(date.getFullYear());
						utcTime = tzYear + dateSeparator + tzMonth + dateSeparator + tzDate;
						break;
					case 'datetime':
					default:
						tzDate = prepend0(date.getDate());
						tzMonth = prepend0(date.getMonth() + 1);
						tzYear = prepend0(date.getFullYear());
						tzHours = prepend0(date.getHours());
						tzMinutes = prepend0(date.getMinutes());
						tzSeconds = prepend0(date.getSeconds());
						utcTime = tzYear + dateSeparator + tzMonth + dateSeparator + tzDate + ' ' + tzHours + ':' + tzMinutes + ':' + tzSeconds;
				}
		}

		return utcTime;
	};

	/*
	 * takes two date objects (representing a date span) and "fixes" them so that the UTC dates are returned, based on the UTZ;
	 * it handles the issues of the +-1 day effect for when using the UTZ feature
	 * depends: $.datepicker
	 * expects: { dateFrom: dateObjFrom, dateTo: dateObjTo }
	 * returns: { dateFrom: dateObjFrom, dateTo: dateObjTo }
	 *

	$z.datetime.dateSpanToUTC = function (dateSpan, nowDate /* FOR INTERNAL USE ONLY *) {
			if (!dateSpan) {
					return {
							dateFrom: $.datepicker.formatDate($.datepicker.ISO_8601, new Date(1970, 0, 1)).toString() + " 00:00:00",
							dateTo: $.datepicker.formatDate($.datepicker.ISO_8601, new Date()).toString() + " 23:59:59"
					};
			} else if (!useUTZFeature()) {
					return {
							dateFrom: dateSpan.dateFrom instanceof Date || (typeof (dateSpan.dateFrom) === 'string' && !/^\s*$/.test(dateSpan.dateFrom))
									? $.datepicker.formatDate($.datepicker.ISO_8601, dateSpan.dateFrom).toString() + " 00:00:00"
									: $.datepicker.formatDate($.datepicker.ISO_8601, new Date(1970, 0, 1)).toString() + " 00:00:00",
							dateTo: dateSpan.dateTo instanceof Date || (typeof (dateSpan.dateTo) === 'string' && !/^\s*$/.test(dateSpan.dateTo))
									? $.datepicker.formatDate($.datepicker.ISO_8601, dateSpan.dateTo).toString() + " 23:59:59"
									: $.datepicker.formatDate($.datepicker.ISO_8601, new Date()).toString() + " 23:59:59"
					};
			}

			var now = $z.datetime.now(nowDate),
					utzHours = $z.datetime.getUTZ() / 60,
					dateModifier = 0,
					dateFrom = dateSpan.dateFrom || null,
					dateTo = dateSpan.dateTo || null;

			// CHECK IF APPLYING THE UTZ EFFECT WOULD REQUIRE UPDATING THE DATE USED
			if (now.utc.getHours() + utzHours < 0) { // utz is -N hours
					// UTZ WOULD LEAP 1 DAY BACKWARDS
					dateModifier += 1;
			} else if (now.utc.getHours() + utzHours >= 24) { // utz is +N hours
					// UTZ WOULD LEAP 1 DAY FORWARDS
					dateModifier += -1;
			}

			// FIX THE dateFrom BASED ON THE UTZ
			if (dateFrom !== null) {
					dateFrom.setDate(dateFrom.getDate() + dateModifier);
					dateFrom = $.datepicker.formatDate($.datepicker.ISO_8601, dateFrom);
					if (typeof (dateFrom) === 'string') {
							dateFrom += ' 00:00:00';
					}
			}

			// FIX THE dateTo BASED ON THE UTZ
			if (dateTo !== null) {
					dateTo.setDate(dateTo.getDate() + dateModifier);
					dateTo = $.datepicker.formatDate($.datepicker.ISO_8601, dateTo);
					if (typeof (dateTo) === 'string') {
							dateTo += ' 23:59:59';
					}
			}

			return {
					dateFrom: dateFrom,
					dateTo: dateTo
			};
	};

	/* fromUTZ: specify the utz from which to transform (i.e., do not assume that input values are in UTC) *
	$z.datetime.tableDateCellsToUTZ = function (tableId, columnIndexes, colIndsWithWeekSpans, fromUTZ) {
			var $tableRows = $('#' + tableId).find('> tbody > tr');

			if ($tableRows.length === 1 && $tableRows.find('td').length === 1) {
					return;
			}

			columnIndexes = typeof (columnIndexes) !== 'undefined' && columnIndexes !== null ? columnIndexes : [];
			colIndsWithWeekSpans = typeof (colIndsWithWeekSpans) !== 'undefined' && colIndsWithWeekSpans !== null ? colIndsWithWeekSpans : [];

			columnIndexes = typeof (columnIndexes) === 'object' ? columnIndexes : [columnIndexes];
			colIndsWithWeekSpans = typeof (colIndsWithWeekSpans) === 'object' ? colIndsWithWeekSpans : [colIndsWithWeekSpans];

			$tableRows.each(function () {
					var $tr = $(this), $td, index, columnIndex, timeTemp;

					/* heuristics for rows that must not be changed *

					if ($tr.hasClass('pager')) {
							return;
					}

					for (index in columnIndexes) {
							columnIndex = columnIndexes[index];
							$td = $tr.find('> td:nth-child(' + columnIndex + ')');
							timeTemp = $td.text();
							if (typeof(fromUTZ) === 'number' && fromUTZ !== 0) {
									timeTemp = $z.datetime.toUTC(timeTemp, {}, fromUTZ);
							}
							$td.html($z.datetime.toUTZ(timeTemp));
					}

					for (index in colIndsWithWeekSpans) {
							columnIndex = colIndsWithWeekSpans[index];
							$td = $tr.find('> td:nth-child(' + columnIndex + ')');
							$td.text($z.datetime.inTextDaySpansToUTZ($td.text()));
					}
			});
	};

	$z.datetime.daySpansToUTZ = function (daySpans, toUTC) {
			var zonesMap = [],
					adjustedDaySpans = [],
					index, subindex,
					dIndex, tIndexFrom, tIndexTo, tIndex,
					tOffset, dOffset,
					zone,
					utz = this.getUTZ(),
					tzHoursOffset = parseFloat(utz / 60),
					inZone = false, fd, ft, td, tt;

			if (daySpans.length === 0 || typeof (toUTC) !== 'boolean') {
					return daySpans;
			}

			for (index = 0; index < 7; index += 1) {
					zonesMap.push([]);

					for (subindex = 0; subindex < 24; subindex += 1) {
							zonesMap[index].push(0);
					}
			}

			if (tzHoursOffset !== 0) {
					tzHoursOffset = parseInt((tzHoursOffset / Math.abs(tzHoursOffset))) * Math.ceil(Math.abs(tzHoursOffset));
			}

			zone = daySpans[daySpans.length - 1];

			if (zone.td === 0 && zone.tt === 0) {
					zone.td = 6;
					zone.tt = 24;
			}

			if (toUTC) {
					tzHoursOffset = -tzHoursOffset;
			}

			/* build a map of the shifted zones *

			for (index = 0; index < daySpans.length; index += 1) {
					zone = daySpans[index];

					for (dIndex = zone.fd; dIndex <= zone.td; dIndex += 1) {
							tIndexFrom = (dIndex === zone.fd ? zone.ft : 0);
							tIndexTo = (dIndex !== zone.td ? 23 : zone.tt - 1);

							for (tIndex = tIndexFrom; tIndex <= tIndexTo; tIndex += 1) {
									tOffset = tIndex + tzHoursOffset;

									if (tOffset < 0) {
											dOffset = dIndex - 1;

											zonesMap[dOffset < 0 ? 6 : dOffset][24 + tOffset] = 1;
									} else if (tOffset > 23) {
											dOffset = dIndex + 1;

											zonesMap[dOffset > 6 ? 0 : dOffset][tOffset - 24] = 1;
									} else {
											zonesMap[dIndex][tOffset] = 1;
									}
							}
					}
			}

			/* for debugging only

			console.log('map:');

			for (index = 0; index < 7; index += 1) {
					var s = '';
					for (subindex = 0; subindex < 24; subindex += 1) {
							s += (zonesMap[index][subindex] + ' ');
					}
					console.log(s);
			}

			// *

			/* restore change from before the mapping process *

			zone = daySpans[daySpans.length - 1];

			if (zone.td === 6 && zone.tt === 24) {
					zone.td = 0;
					zone.tt = 0;
			}

			/* rebuild the zones from the zones' map *

			for (index = 0; index < 7; index += 1) {
					for (subindex = 0; subindex < 24; subindex += 1) {
							if (zonesMap[index][subindex] === 1) {
									if (!inZone) {
											fd = index;
											ft = subindex;

											inZone = true;
									}
							} else if (inZone) {
									td = index;
									tt = subindex;

									adjustedDaySpans.push({ fd: fd, ft: ft, td: td, tt: tt });

									inZone = false;
							}
					}
			}

			/* reached the end without finding the end of a zone *

			if (inZone) {
					adjustedDaySpans.push({ fd: fd, ft: ft, td: 6, tt: 23 });
			}

			zone = adjustedDaySpans[adjustedDaySpans.length - 1];

			if (zonesMap[6][23] === 1 && zone.td === 6 && zone.tt === 23) {
					zone.td = 0;
					zone.tt = 0;
			}

			return adjustedDaySpans;
	};

	$z.datetime.inTextDaySpansToUTZ = function (text) {
			if (typeof (text) === 'undefined') {
					return text;
			}

			var daySpansText = text.match(/(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)\s+[0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2}/gi),
					daySpans = [],
					daysToIndicesAndBack = {
							monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6,
							0: 'monday', 1: 'tuesday', 2: 'wednesday', 3: 'thursday', 4: 'friday', 5: 'saturday', 6: 'sunday'
					},
					daySpanStart, daySpanStop,
					index, subindex,
					formattedUTZ = this.getFormattedUTZ();

			if (typeof (daySpansText) === 'undefined' ||
					daySpansText === null ||
					daySpansText.length === 0 ||
					daySpansText.length % 2 !== 0) {
					return text;
			}

			for (index = 0; index < daySpansText.length; index += 2) {
					daySpanStart = daySpansText[index].split(/\s+/);
					daySpanStart[0] = daysToIndicesAndBack[daySpanStart[0].toLowerCase()];
					daySpanStart[1] = parseInt(daySpanStart[1].split(/:/)[0]);
					daySpanStop = daySpansText[index + 1].split(/\s+/);
					daySpanStop[0] = daysToIndicesAndBack[daySpanStop[0].toLowerCase()];
					daySpanStop[1] = parseInt(daySpanStop[1].split(/:/)[0]);

					daySpans.push({ fd: daySpanStart[0], ft: daySpanStart[1], td: daySpanStop[0], tt: daySpanStop[1] });
			}

			daySpans = this.daySpansToUTZ(daySpans, false);

			if (daySpans.length !== (daySpansText.length / 2)) {
					return text;
			}

			text = text.replace(/\s*(UTC|GMT)\s*([+-][0-9]{2,4})?/gi, '');

			for (index = 0; index < daySpansText.length; index += 1) {
					text = text.replace(new RegExp(daySpansText[index]), '_{' + index + '}_');
			}

			for (index = 0; index < daySpans.length; index += 1) {
					subindex = 2 * index;

					daySpanStart = [daysToIndicesAndBack[daySpans[index].fd].toUpperCase(),
													 prepend0(daySpans[index].ft.toString()) + ':00:00'].join(' ');

					daySpanStop = [daysToIndicesAndBack[daySpans[index].td].toUpperCase(),
													prepend0(daySpans[index].tt.toString()) + ':00:00',
													formattedUTZ].join(' ');

					text = text.replace('_{' + subindex + '}_', daySpanStart).replace('_{' + (subindex + 1) + '}_', daySpanStop);
			}

			return text;
	};
	*/
	window.tzDate = tzDate;
})();
