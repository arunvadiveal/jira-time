import React, { Component, PropTypes } from 'react';
import { default as swal } from 'sweetalert2';

import Records from 'modules/Records';
import RecordActionButtons from 'modules/RecordActionButtons';
import { updateRemainingEstimate } from 'shared/taskHelper';
import DeleteIcon from 'assets/delete.svg';
import './TaskItem.scss';

let focusingOnRemaining = false;

export class TaskItem extends Component {

    static get propTypes () {
        return {
            task: PropTypes.object.isRequired,
            index: PropTypes.number,
            setIssueRemainingEstimate: PropTypes.func.isRequired,
            movingRecord: PropTypes.object,
            movingTask: PropTypes.object,
            removeTask: PropTypes.func.isRequired,
            numberOfRecords: PropTypes.number
        };
    }

    constructor (props) {
        super(props);

        this.onRemainignChange = this.onRemainignChange.bind(this);
        this.onRemainignBlur = this.onRemainignBlur.bind(this);
        this.setRemainingInputValue = this.setRemainingInputValue.bind(this);
        this.onRemoveClick = this.onRemoveClick.bind(this);

        this.state = {};
    }

    componentWillUpdate () {
        if (this.props.task && this.props.task.issue) {
            this.setRemainingInputValue(this.props.task.issue.fields.timetracking.remainingEstimate);
        }
    }

    setRemainingInputValue (remaining = '') {
        if (!focusingOnRemaining) {
            const remInp = this.refs.inputRemaining;
            if (remInp && remInp.value !== remaining) {
                remInp.value = remaining;
            }
        }
    }

    onRemainignFocus (e) {
        focusingOnRemaining = true;
    }

    onRemainignChange (e) {

        const remainingEstimate = e.target.value;

        const { task } = this.props;

        this.props.setIssueRemainingEstimate({
            cuid: task.cuid,
            remainingEstimate
        });
    }

    onRemainignBlur (e) {

        focusingOnRemaining = false;

        const remainingEstimate = e.target.value;

        const { task } = this.props;

        updateRemainingEstimate({
            taskCuid: task.cuid,
            taskIssueKey: task.issue.key,
            remainingEstimate
        });
    }

    onRemoveClick () {

        const { numberOfRecords, removeTask, task } = this.props;

        if (numberOfRecords > 0) {
            let worklogName = numberOfRecords === 1 ? 'worklog' : 'worklogs';
            swal({
                title: 'Hold on dude! Are you sure?',
                text: `You have ${numberOfRecords} ${worklogName} on this task`,
                type: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, get rid of it all!',
                cancelButtonText: 'Shit, NO!'
            }).then(function () {
                removeTask({ cuid: task.cuid });
            }).catch(() => {
                // No? Good thing we asked this question then =)
            });
        } else {
            removeTask({ cuid: task.cuid });
        }
    }

    render () {

        const { task, movingRecord, movingTask, index } = this.props;
        let className = 'task-item';
        if (movingRecord && movingRecord.taskDroppableCuid === task.cuid) {
            className += ' task-item--drop-active';
        }

        const records = <Records taskCuid={task.cuid} taskIndex={index} />;

        // This task does have a JIRA issue
        if (task.issue) {

            // There are errors with the task. Display that instead of issue info
            if (task.issue.errorMessages && task.issue.errorMessages.length > 0) {
                return (
                    <div className='task-item task-item--errors'>
                        <span className='task-item-delete' title='Delete work log' onClick={this.onRemoveClick}>
                            <img src={DeleteIcon} alt='Delete' className='task-item-delete-icon' />
                        </span>
                        <div className='task-item-info'>
                            <span className='task-item__summary'>
                                {task.issue.errorMessages.map((e, i) => (<div key={i}>{e}</div>))}
                            </span>
                        </div>
                        {records}
                    </div>
                );
            }
        }

        let remainingEstimate = task.issue.fields.timetracking.remainingEstimate;
        if (!remainingEstimate || remainingEstimate === 'undefined') {
            remainingEstimate = null;
        }

        const status = (
            task.issue.fields.status
            ? <span className='task-item__status'>{task.issue.fields.status.name}</span>
            : null
        );

        const somethingIsMoving = !!movingRecord || !!movingTask;

        // Output the task
        return (
            <div className={className} data-cuid={task.cuid} data-taskissuekey={task.issue ? task.issue.key : null}>
                <span className='task-item-delete' title='Delete work log' onClick={this.onRemoveClick}>
                    <img src={DeleteIcon} alt='Delete' className='task-item-delete-icon' />
                </span>
                <div className='task-item__info'>
                    <div className='task-item__left'>
                        <div className='task-item__key-and-status'>
                            <a className='task-item__link'
                              href={'/browse/' + task.issue.key}
                              target='_blank'>
                                {task.issue.key}
                            </a>
                            {status}
                        </div>
                        <div className='task-item__summary' title={task.issue.fields.summary}>
                            {task.issue.fields.summary}
                        </div>
                    </div>
                    <div className='task-item__right'>
                        <div className='task-item__remaining'>
                            <input className='task-item__remaining-input'
                              value={remainingEstimate || ''}
                              onFocus={this.onRemainignFocus}
                              onChange={this.onRemainignChange}
                              onBlur={this.onRemainignBlur}
                              ref='inputRemaining'
                              disabled={!!somethingIsMoving}
                              title='Remaining estimate'
                            />
                        </div>
                        <RecordActionButtons task={task} onRemainingUpdated={this.setRemainingInputValue} />
                    </div>
                </div>
                {records}
            </div>
        );
    }
}

export default TaskItem;
