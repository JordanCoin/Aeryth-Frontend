import axios from 'axios';
import { logger } from '@/utils/logger';
import { ZoomMeeting } from '@/types/task.types';

interface ZoomMeetingRequest {
  topic: string;
  type: 2; // Scheduled meeting
  start_time: string;
  duration: number;
  timezone: string;
  agenda?: string;
}

export const zoomService = {
  async createMeeting(taskTitle: string, startTime: string, duration = 30): Promise<ZoomMeeting> {
    try {
      const response = await axios.post('/api/zoom/meetings', {
        topic: taskTitle,
        type: 2,
        start_time: startTime,
        duration,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      } as ZoomMeetingRequest);

      logger.info('Zoom meeting created', { taskTitle, meetingId: response.data.id });

      return {
        meetingId: response.data.id,
        scheduledTime: response.data.start_time,
        notes: null,
      };
    } catch (error) {
      logger.error('Failed to create Zoom meeting', { error, taskTitle });
      throw error;
    }
  },

  async getMeetingNotes(meetingId: string): Promise<ZoomMeeting['notes']> {
    try {
      const response = await axios.get(`/api/zoom/meetings/${meetingId}/notes`);

      logger.info('Retrieved meeting notes', { meetingId });

      return {
        summary: response.data.summary,
        actionItems: response.data.action_items,
        timestamp: response.data.timestamp,
      };
    } catch (error) {
      logger.error('Failed to get meeting notes', { error, meetingId });
      throw error;
    }
  },
};
