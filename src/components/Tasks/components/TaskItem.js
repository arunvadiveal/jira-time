import React, { Component, PropTypes } from 'react';
import TaskItemRecord from '../containers/TaskItemRecord';
import RecordModel from '../../Recorder/modules/RecordModel';

import { getIssue, setIssueRemaining } from '../../../shared/jiraClient';

import LoadingIcon from '../../../assets/loading.svg';
import RefreshIcon from '../../../assets/refresh.svg';

import './TaskItem.scss';

export class TaskItem extends Component {

  static get propTypes () {
    return {
      task: PropTypes.object.isRequired,
      records: PropTypes.array.isRequired,
      removeTask: PropTypes.func.isRequired,
      addRecord: PropTypes.func.isRequired,
      startRecording: PropTypes.func.isRequired,
      refreshIssue: PropTypes.func.isRequired,
      setIssueRefreshing: PropTypes.func.isRequired
    };
  }

  constructor (props) {
    super(props);

    this.onRemoveClick = this.onRemoveClick.bind(this);
    this.onStartPassiveLogClick = this.onStartPassiveLogClick.bind(this);
    this.onStartActiveLogClick = this.onStartActiveLogClick.bind(this);
    this.onIssueRefreshClick = this.onIssueRefreshClick.bind(this);
    this.onRemainignBlur = this.onRemainignBlur.bind(this);

    this.state = {};
  }

  componentDidUpdate () {

    // Update the remaining estimate since we allow it to be an uncontrolled input
    if (this.refs.inputRemaining) {
      const { issue } = this.props.task;
      this.refs.inputRemaining.value = this.state.remainingEstimate || issue.fields.timetracking.remainingEstimate;
    }
  }

  onRemoveClick () {
    this.props.removeTask({ cuid: this.props.task.cuid });
  }

  onStartPassiveLogClick () {
    const { task } = this.props;

    const startTime = Date.now();
    const endTime = new Date();
    endTime.setMinutes(endTime.getMinutes() + 1);

    this.props.addRecord({
      task,
      record: RecordModel({
        task,
        startTime,
        endTime
      })
    });
  }

  onStartActiveLogClick () {
    const { task } = this.props;

    this.props.startRecording({
      task,
      record: RecordModel({ task })
    });
  }

  onIssueRefreshClick () {
    const { task } = this.props;

    this.props.setIssueRefreshing({
      cuid: task.cuid,
      refreshing: true
    });

    getIssue({
      id: task.issue.key
    })
    .then((issue) => {
      this.props.refreshIssue({
        cuid: task.cuid,
        issue
      });
    });
  }

  onRemainignBlur (e) {

    const remainingEstimate = e.target.value;

    this.setState({
      remainingEstimate
    });

    const { task } = this.props;

    this.props.setIssueRefreshing({
      cuid: task.cuid,
      refreshing: true
    });

    getIssue({
      id: task.issue.key
    })
    .then((issue) => {

      issue.fields.timetracking.remainingEstimate = remainingEstimate;

      this.props.refreshIssue({
        cuid: task.cuid,
        issue
      });

      setIssueRemaining({
        id: task.issue.key,
        remainingEstimate,

        /*
          We need to send the original estimate along due to a bug in the JIRA REST API:
          https://jira.atlassian.com/browse/JRA-30459
        */
        originalEstimate: issue.fields.timetracking.originalEstimate
      })
      .then(() => {
        this.setState({
          remainingEstimate: null
        });
      });
    });
  }

  render () {

    const { task } = this.props;

    // Get the records for this task
    let records = [];
    this.props.records.forEach(record => {
      if (record.taskCuid === task.cuid) {
        records.push(record);
      }
    });

    let recordItems = records.map((record, index) => {
      return (<TaskItemRecord recordCuid={record.cuid} record={record} key={index} />);
    });

    let refreshIcon;

    if (task.issue) {

      // There are errors with the task. Display that instead of issue info
      if (task.issue.errorMessages && task.issue.errorMessages.length > 0) {
        return (
          <div className='task-item task-item--errors'>
            <div className='task-item-info'>
              <button className='task-item__remove' onClick={this.onRemoveClick}>x</button>
              <span className='task-item__summary'>
                {task.issue.errorMessages.map((e, i) => <div key={i}>{e}</div>)}
              </span>
            </div>
            <div className='task-item-records'>{recordItems}</div>
          </div>
        );
      }

      refreshIcon = (
        <span className='task-item__issue-refresh'
          title='Click to refresh the JIRA issue, yo!'
          onClick={this.onIssueRefreshClick}>
          <img src={RefreshIcon} alt='Refresh' className='task-item__issue-refresh-image' />
        </span>
      );
    }
    if (task.issueRefreshing) {
      refreshIcon = (
        <span className='task-item__issue-refresh'>
          <img src={LoadingIcon} alt='Loading' className='task-item__loading' />
        </span>
      );
    }

    // Output the list of tasks
    return (
      <div className='task-item'>
        <div className='task-item-info'>
          <button className='task-item__remove' onClick={this.onRemoveClick}>x</button>
          <span className='task-item__key'>
            <a href={'/browse/' + task.issue.key} target='_blank'>{task.issue.key}</a>
            {refreshIcon}
          </span>
          <span className='task-item__summary'>{task.issue.fields.summary}</span>
          <input className='task-item__remaining'
            defaultValue={task.issue.fields.timetracking.remainingEstimate}
            onBlur={this.onRemainignBlur}
            ref='inputRemaining'
          />
          <button className='task-item__log task-item__log--passive'
            title='Add a worklog'
            onClick={this.onStartPassiveLogClick}>+</button>
          <button className='task-item__log task-item__log--active'
            title='Start new worklog'
            onClick={this.onStartActiveLogClick}>●</button>
        </div>
        <div className='task-item-records'>{recordItems}</div>
      </div>
    );
  }
}

export default TaskItem;
