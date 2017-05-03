import React, { Component, PropTypes } from 'react';
import styled from 'styled-components';

import Bar from './Bar';
import { updateRemainingEstimate, refreshJiraIssue, issueIsClosed } from 'shared/taskHelper';

const Wrapper = styled.div`
    margin-right: 10px;
    font-size: .75rem;
    min-width: 150px;
    max-width: 200px;
    flex-grow: 1;
    flex-shrink: 0;
    cursor: default;
    display: flex;
    align-items: center;

    .compact-view & {
        min-width: 0;
    }

    @media (min-width: 544px) {
        margin-left: 10px;
    }

    @media (max-width: 543px) {
        min-width: 0px;
    }
`;

const Percentage = styled.div`
    flex: 0 0 auto;
    text-align: right;

    .compact-view & {
        display: none;
    }
`;

const Remaining = styled.div`
    flex: 0 0 auto;
`;

const RemainingInput = styled.input`
    padding: 0 2px;
    border: none;
    background: transparent;
    color: #fff;
    width: 40px;

    .compact-view & {
        text-align: right;
    }
`;

const Bars = styled.div`
    flex: 1 1 auto;
    margin: 0 5px;

    .compact-view & {
        display: none;
    }
`;

export default class TimeTrackingInfo extends Component {

    static propTypes = {
        task: PropTypes.object.isRequired,
        somethingIsMoving: PropTypes.bool,
        setIssueRemainingEstimate: PropTypes.func.isRequired
    }

    constructor (props) {
        super(props);

        this.onRemainingChange = this.onRemainingChange.bind(this);
        this.onRemainingBlur = this.onRemainingBlur.bind(this);

        this.state = {
            remainingEstimate: props.task.issue.fields.timetracking.remainingEstimate
        };
    }

    onRemainingChange (e) {
        this.props.setIssueRemainingEstimate({
            cuid: this.props.task.cuid,
            remainingEstimate: e.target.value
        });
    }

    onRemainingBlur (e) {
        let remainingEstimate = e.target.value;
        const { task, setIssueRemainingEstimate } = this.props;

        // Default the value to 0h
        if (!remainingEstimate) {
            remainingEstimate = '0h';
        }

        if (remainingEstimate !== this.state.remainingEstimate) {
            this.setState({
                remainingEstimate
            }, () => {

                // Update redux state
                setIssueRemainingEstimate({
                    cuid: task.cuid,
                    remainingEstimate
                });

                // Send updates to server
                updateRemainingEstimate({
                    taskCuid: task.cuid,
                    taskIssueKey: task.issue.key,
                    remainingEstimate
                }).then(() => {
                    return refreshJiraIssue({
                        taskCuid: task.cuid,
                        taskIssueKey: task.issue.key
                    });
                });
            });
        }
    }

    getUsedEstimatePercentage (originalEstimateSeconds, remainingEstimateSeconds) {
        let usedEstimatePct = ((originalEstimateSeconds - remainingEstimateSeconds) / originalEstimateSeconds) * 100;
        if (usedEstimatePct > 100) {
            usedEstimatePct = 100;
        } else if (usedEstimatePct < 0) {
            usedEstimatePct = 0;
        }
        return Math.floor(usedEstimatePct);
    }

    render () {
        const { task, somethingIsMoving } = this.props;

        let {
            remainingEstimate,
            remainingEstimateSeconds,
            originalEstimate,
            originalEstimateSeconds,
            timeSpent,
            timeSpentSeconds
        } = task.issue.fields.timetracking;

        if (!remainingEstimate || remainingEstimate === 'undefined' || !originalEstimate) {
            return null;
        }

        const timeSpentAndRemaining = timeSpentSeconds + remainingEstimateSeconds;
        const largest = Math.max(timeSpentAndRemaining, originalEstimateSeconds);

        const widthOriginalEstimate = (originalEstimateSeconds / largest) * 100;
        const widthTimeSpentAndRemaining = (timeSpentAndRemaining / largest) * 100;
        let progress = (timeSpentSeconds / remainingEstimateSeconds) * 100;
        if (!isFinite(progress)) {
            progress = 0;
        }

        return (
            <Wrapper>
                <Percentage>{`${Math.round(progress)}%`}</Percentage>
                <Bars>
                    <Bar
                      width={widthOriginalEstimate}
                      title={`Original estimate: ${originalEstimate}`}
                    />
                    <Bar
                      width={widthTimeSpentAndRemaining}
                      lineWidth={progress}
                      title={`Time spent: ${timeSpent}`}
                    />
                </Bars>
                <Remaining>
                    <RemainingInput
                      value={remainingEstimate}
                      title={remainingEstimate + ' remaining'}
                      onChange={this.onRemainingChange}
                      onBlur={this.onRemainingBlur}
                      disabled={issueIsClosed(task) || somethingIsMoving}
                      tabIndex='-1'
                      ref={el => this.remainingElement = el}
                    />
                </Remaining>
            </Wrapper>
        );
    }
}
