import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { ChapterCommentsSection } from '../src/components/ChapterCommentsSection';
import { fetchChapterComments } from '../src/services/api';
import { saveUserComment } from '../src/services/storage';
import { CommentItem } from '../src/types';

jest.mock('lucide-react-native', () => Object.fromEntries(
  ['MessageCircle', 'Heart', 'Send', 'Flame', 'CornerDownRight', 'ChevronDown', 'ChevronUp'].map(name => [name, () => null]),
));
jest.mock('../src/services/api', () => ({ fetchChapterComments: jest.fn() }));
jest.mock('../src/services/storage', () => ({ saveUserComment: jest.fn(), toggleCommentLike: jest.fn() }));

test('keeps a failed draft and enables retry after storage recovers', async () => {
  jest.mocked(fetchChapterComments).mockResolvedValue([]);
  jest.mocked(saveUserComment).mockRejectedValueOnce(new Error('Full')).mockResolvedValue(undefined);
  await render(<ChapterCommentsSection novelId="novel" chapterId="ch-01" theme="light" />);
  const input = screen.getByPlaceholderText('เขียนความในใจหลังอ่านจบ...');
  await fireEvent.changeText(input, 'My draft');
  await fireEvent.press(screen.getByRole('button', { name: 'บันทึกความคิดเห็น' }));
  expect(await screen.findByRole('alert')).toBeTruthy();
  expect(input.props.value).toBe('My draft');
  await fireEvent.press(screen.getByRole('button', { name: 'บันทึกความคิดเห็น' }));
  expect(screen.queryByRole('alert')).toBeNull();
  expect(input.props.value).toBe('');
  expect(screen.getByText('My draft')).toBeTruthy();
});

test('waits for initial comments before saving so a late load cannot replace a new comment', async () => {
  let resolve!: (items: CommentItem[]) => void;
  jest.mocked(fetchChapterComments).mockReturnValue(new Promise(done => { resolve = done; }));
  jest.mocked(saveUserComment).mockClear().mockResolvedValue(undefined);
  await render(<ChapterCommentsSection novelId="novel" chapterId="ch-01" theme="light" />);
  await fireEvent.changeText(screen.getByPlaceholderText('เขียนความในใจหลังอ่านจบ...'), 'My draft');
  await fireEvent.press(screen.getByRole('button', { name: 'บันทึกความคิดเห็น' }));
  expect(saveUserComment).not.toHaveBeenCalled();
  await act(async () => resolve([]));
  await fireEvent.press(screen.getByRole('button', { name: 'บันทึกความคิดเห็น' }));
  expect(screen.getByText('My draft')).toBeTruthy();
});
