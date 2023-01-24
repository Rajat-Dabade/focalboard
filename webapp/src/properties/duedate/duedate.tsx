// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {useIntl} from 'react-intl'
import MomentLocaleUtils from 'react-day-picker/moment'
import DayPicker from 'react-day-picker/DayPicker'
import moment from 'moment'

import {DateUtils} from 'react-day-picker'

import Button from '../../widgets/buttons/button'
import {Utils} from '../../utils'
import {createDatePropertyFromString, DateProperty} from '../date/date'

import {PropertyProps} from '../types'
import './dueDate.scss'
import ModalWrapper from '../../components/modalWrapper'
import Modal from '../../components/modal'
import CompassIcon from '../../widgets/icons/compassIcon'
import mutator from '../../mutator'
import Editable from '../../widgets/editable'

const datePropertyToString = (dateProperty: DateProperty): string => {
    return dateProperty.from || dateProperty.to ? JSON.stringify(dateProperty) : ''
}

const DueDate = (props: PropertyProps): JSX.Element => {
    const {propertyValue, propertyTemplate, showEmptyPlaceholder, readOnly, board, card} = props
    const [value, setValue] = useState(propertyValue)
    const [showDialog, setShowDialog] = useState(false)
    const [numberOfMonths, setNumberOfMonths] = useState(1)

    const intl = useIntl()

    const onChange = useCallback((newValue) => {
        if (value !== newValue) {
            setValue(newValue)
            mutator.changePropertyValue(board.id, card, propertyTemplate.id, newValue)
        }
    }, [value, board.id, card, propertyTemplate.id])

    const getDisplayDate = (date: Date| null | undefined) => {
        let displayDate = ''
        if (date) {
            displayDate = Utils.displayDate(date, intl)
        }
        return displayDate
    }

    const timeZoneOffset = (date: number): number => {
        return new Date(date).getTimezoneOffset() * 60 * 1000
    }

    const dateProperty = useMemo(() => createDatePropertyFromString(value as string), [value])

    const dateFrom = dateProperty.from ? new Date(dateProperty.from + (dateProperty.includeTime ? 0 : timeZoneOffset(dateProperty.from))) : undefined
    const dateTo = dateProperty.to ? new Date(dateProperty.to + (dateProperty.includeTime ? 0 : timeZoneOffset(dateProperty.to))) : undefined
    const [fromInput, setFromInput] = useState<string>(getDisplayDate(dateFrom))
    const [toInput, setToInput] = useState<string>(getDisplayDate(dateTo))

    const isRange = dateFrom !== undefined

    const locale = intl.locale.toLowerCase()

    const handleDayClick = (day: Date) => {
        const range: DateProperty = {}
        if (isRange) {
            const newRange = DateUtils.addDayToRange(day, {from: dateFrom, to: dateTo})
            range.from = newRange.from?.getTime()
            range.to = newRange.to?.getTime()
        } else {
            range.from = undefined
            range.to = day.getTime()
        }
        saveRangeValue(range)
    }

    const onRangeClick = () => {
        setNumberOfMonths(2)
        let range: DateProperty = {
            from: dateTo?.getTime(),
            to: dateTo?.getTime(),
        }
        if (isRange) {
            range = ({
                from: undefined,
                to: dateTo?.getTime(),
            })
            setNumberOfMonths(1)
        }
        saveRangeValue(range)
    }

    const saveRangeValue = (range: DateProperty) => {
        const rangeUTC = {...range}
        if (rangeUTC.from) {
            rangeUTC.from -= dateProperty.includeTime ? 0 : timeZoneOffset(rangeUTC.from)
        }
        if (rangeUTC.to) {
            rangeUTC.to -= dateProperty.includeTime ? 0 : timeZoneOffset(rangeUTC.to)
        }
        onChange(datePropertyToString(rangeUTC))
        setFromInput(getDisplayDate(range.from ? new Date(range.from) : undefined))
        setToInput(getDisplayDate(range.to ? new Date(range.to) : undefined))
    }

    let displayValue = ''
    if (dateTo) {
        displayValue = getDisplayDate(dateTo)
    }
    useEffect(() => {
        if (dateFrom) {
            setNumberOfMonths(2)
        }
    }, [dateFrom])

    if (dateFrom) {
        displayValue = getDisplayDate(dateFrom) + ' → ' + getDisplayDate(dateTo)
    }

    const onClose = () => {
        onChange(datePropertyToString(dateProperty))
        setShowDialog(false)
    }

    let buttonText = displayValue
    if (!buttonText && showEmptyPlaceholder) {
        buttonText = intl.formatMessage({id: 'DueDate.empty', defaultMessage: 'Empty'})
    }

    const className = props.property.valueClassName(readOnly)
    if (readOnly) {
        return <div className={className}>{displayValue}</div>
    }

    return (
        <div className={`DueDate ${displayValue ? '' : 'empty'}` + className}>
            <Button
                onClick={() => setShowDialog(true)}
            >
                {buttonText}
            </Button>

            {showDialog &&
             <ModalWrapper>
                 <Modal
                     onClose={() => onClose()}
                 >
                     <div
                         className={className + '-overlayWrapper'}
                     >
                         <div className={className + '-overlay'}>
                             <div className={'inputContainer'}>
                                 {numberOfMonths === 1 &&
                                  <Button
                                      onClick={onRangeClick}
                                      className='add-start-date'
                                  >
                                      {'+ Add Start date'}
                                  </Button>}
                                 {dateFrom &&
                                  <>
                                      <Editable
                                          value={fromInput}
                                          placeholderText={moment.localeData(locale).longDateFormat('L')}
                                          onFocus={() => {
                                              if (dateFrom) {
                                                  return setFromInput(Utils.inputDate(dateFrom, intl))
                                              }
                                              return undefined
                                          }}
                                          onChange={setFromInput}
                                          onSave={() => {
                                              const newDate = MomentLocaleUtils.parseDate(fromInput, 'L', intl.locale)
                                              if (newDate && DateUtils.isDate(newDate)) {
                                                  newDate.setHours(12)
                                                  const range: DateProperty = {
                                                      from: newDate.getTime(),
                                                      to: dateTo?.getTime(),
                                                  }
                                                  saveRangeValue(range)
                                              } else {
                                                  setFromInput(getDisplayDate(dateFrom))
                                              }
                                          }}
                                          onCancel={() => {
                                              setFromInput(getDisplayDate(dateFrom))
                                          }}
                                      />
                                  </>}
                                 <Editable
                                     value={toInput}
                                     placeholderText={moment.localeData(locale).longDateFormat('L')}
                                     onFocus={() => {
                                         if (dateTo) {
                                             return setToInput(Utils.inputDate(dateTo, intl))
                                         }
                                         return undefined
                                     }}
                                     onChange={setToInput}
                                     onSave={() => {
                                         const newDate = MomentLocaleUtils.parseDate(toInput, 'L', intl.locale)
                                         if (newDate && DateUtils.isDate(newDate)) {
                                             newDate.setHours(12)
                                             const range: DateProperty = {
                                                 from: dateFrom?.getTime(),
                                                 to: newDate.getTime(),
                                             }
                                             saveRangeValue(range)
                                         } else {
                                             setToInput(getDisplayDate(dateTo))
                                         }
                                     }}
                                     onCancel={() => {
                                         setToInput(getDisplayDate(dateTo))
                                     }}
                                 />
                             </div>
                             {numberOfMonths === 2 &&
                             <Button
                                 onClick={onRangeClick}
                             >
                                 {'Single Date'}
                             </Button>}
                             <DayPicker
                                 numberOfMonths={numberOfMonths}
                                 onDayClick={handleDayClick}
                                 initialMonth={dateFrom || new Date()}
                                 showOutsideDays={false}
                                 locale={locale}
                                 localeUtils={MomentLocaleUtils}
                                 todayButton={intl.formatMessage({id: 'DueDate.today', defaultMessage: 'Today'})}
                                 onTodayButtonClick={handleDayClick}
                                 month={dateTo}
                                 selectedDays={[dateFrom ? {from: dateFrom, to: dateTo} : {from: dateTo, to: dateTo}, dateTo]}
                                 modifiers={dateFrom ? {start: dateFrom, end: dateTo} : {start: dateTo, end: dateTo}}
                             />
                             <div className='reminder-section'>
                                 <CompassIcon
                                     icon='bell-outline'
                                     className='reminder-icon'
                                 />
                                 {intl.formatMessage({id: 'DueDate.reminderMessage', defaultMessage: 'The reminder will be sent to all followers on the deu date'})}
                             </div>
                         </div>
                     </div>
                 </Modal>
             </ModalWrapper>
            }
        </div>
    )
}

export default DueDate
