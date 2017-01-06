import React, { Component, PropTypes } from 'react';

import RecordItem from 'modules/RecordItem';

import './TasksInLimbo.scss';

export class TasksInLimbo extends Component {

    static propTypes = {
        movingRecord: PropTypes.object,
        recordsWithNoIssue: PropTypes.array.isRequired
    }

    render () {

        const { movingRecord, recordsWithNoIssue } = this.props;

        let textInLimbo;
        switch (recordsWithNoIssue.length) {
        case 0 : {
            textInLimbo = 'No work logs in limbo!';
            break;
        }
        case 1 : {
            textInLimbo = 'Just one work log in limbo';
            break;
        }
        case 2 :
        case 3 :
        case 4 : {
            textInLimbo = `${recordsWithNoIssue.length} work logs in limbo`;
            break;
        }
        default : {
            textInLimbo = `Oh dear. You have ${recordsWithNoIssue.length} work logs in limbo`;
            break;
        }
        }

        let className = 'task-item task-item--limbo';
        if (movingRecord && !movingRecord.taskDroppableCuid) {
            className += ' task-item--drop-active';
        }

        // Output the list of tasks
        return (
            <div className={className}>
                <div className='records records--no-issue'>
                    <div className='records-header'>{textInLimbo}</div>
                    {recordsWithNoIssue.map((record) => (
                        <RecordItem recordCuid={record.cuid} record={record} key={record.cuid} />
                    ))}
                </div>
            </div>
        );
    }
}

export default TasksInLimbo;
