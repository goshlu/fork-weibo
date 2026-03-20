import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { ProfileEditor } from './ProfileEditor';
import type { ProfileFormState } from '../../types/app';

// Helper to create mock profile form state
function createMockProfileForm(overrides: Partial<ProfileFormState> = {}): ProfileFormState {
  return {
    nickname: 'Test User',
    bio: 'Test bio',
    password: '',
    ...overrides,
  };
}

// Mock URL.createObjectURL
const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

beforeAll(() => {
  URL.createObjectURL = vi.fn(() => 'blob:test-url');
  URL.revokeObjectURL = vi.fn();
});

afterAll(() => {
  URL.createObjectURL = originalCreateObjectURL;
  URL.revokeObjectURL = originalRevokeObjectURL;
});

describe('ProfileEditor', () => {
  const defaultHandlers = {
    onApplyAvatar: vi.fn(),
    onAvatarPick: vi.fn(),
    onCancelAvatar: vi.fn(),
    onCropChange: vi.fn(),
    onProfileFormChange: vi.fn(),
    onSaveProfile: vi.fn(),
  };

  const defaultProps = {
    avatarPreview: '',
    busy: '',
    crop: { scale: 1, offsetX: 50, offsetY: 50 },
    pendingAvatar: null as File | null,
    profileForm: createMockProfileForm(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render avatar input', () => {
      render(
        <ProfileEditor
          {...defaultProps}
          {...defaultHandlers}
        />
      );

      expect(screen.getByLabelText('Avatar')).toBeInTheDocument();
      expect(screen.getByLabelText('Avatar')).toHaveAttribute('type', 'file');
      expect(screen.getByLabelText('Avatar')).toHaveAttribute('accept', 'image/*');
    });

    it('should render nickname input', () => {
      render(
        <ProfileEditor
          {...defaultProps}
          {...defaultHandlers}
        />
      );

      expect(screen.getByLabelText('Nickname')).toBeInTheDocument();
      expect(screen.getByLabelText('Nickname')).toHaveValue('Test User');
    });

    it('should render bio textarea', () => {
      render(
        <ProfileEditor
          {...defaultProps}
          {...defaultHandlers}
        />
      );

      expect(screen.getByLabelText('Bio')).toBeInTheDocument();
      expect(screen.getByLabelText('Bio')).toHaveValue('Test bio');
    });

    it('should render password input', () => {
      render(
        <ProfileEditor
          {...defaultProps}
          {...defaultHandlers}
        />
      );

      expect(screen.getByLabelText('New password')).toBeInTheDocument();
      expect(screen.getByLabelText('New password')).toHaveAttribute('type', 'password');
      expect(screen.getByLabelText('New password')).toHaveValue('');
    });

    it('should render password placeholder', () => {
      render(
        <ProfileEditor
          {...defaultProps}
          {...defaultHandlers}
        />
      );

      expect(screen.getByPlaceholderText('Leave blank to keep current password')).toBeInTheDocument();
    });

    it('should render save profile button', () => {
      render(
        <ProfileEditor
          {...defaultProps}
          {...defaultHandlers}
        />
      );

      expect(screen.getByRole('button', { name: 'Save profile' })).toBeInTheDocument();
    });
  });

  describe('avatar handling', () => {
    it('should not show crop panel when no pending avatar', () => {
      render(
        <ProfileEditor
          {...defaultProps}
          pendingAvatar={null}
          {...defaultHandlers}
        />
      );

      expect(screen.queryByText('Zoom')).not.toBeInTheDocument();
    });

    it('should show crop panel when pending avatar exists', () => {
      const mockFile = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });

      render(
        <ProfileEditor
          {...defaultProps}
          pendingAvatar={mockFile}
          avatarPreview="blob:test-url"
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('Zoom')).toBeInTheDocument();
      expect(screen.getByText('Horizontal')).toBeInTheDocument();
      expect(screen.getByText('Vertical')).toBeInTheDocument();
    });

    it('should call onAvatarPick when file is selected', async () => {
      const user = userEvent.setup();
      const onAvatarPick = vi.fn();
      const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });

      render(
        <ProfileEditor
          {...defaultProps}
          onAvatarPick={onAvatarPick}
          onApplyAvatar={defaultHandlers.onApplyAvatar}
          onCancelAvatar={defaultHandlers.onCancelAvatar}
          onCropChange={defaultHandlers.onCropChange}
          onProfileFormChange={defaultHandlers.onProfileFormChange}
          onSaveProfile={defaultHandlers.onSaveProfile}
        />
      );

      const fileInput = screen.getByLabelText('Avatar');
      await user.upload(fileInput, file);

      expect(onAvatarPick).toHaveBeenCalledWith(file);
    });

    it('should not call onAvatarPick when no file selected', async () => {
      const onAvatarPick = vi.fn();

      render(
        <ProfileEditor
          {...defaultProps}
          onAvatarPick={onAvatarPick}
          onApplyAvatar={defaultHandlers.onApplyAvatar}
          onCancelAvatar={defaultHandlers.onCancelAvatar}
          onCropChange={defaultHandlers.onCropChange}
          onProfileFormChange={defaultHandlers.onProfileFormChange}
          onSaveProfile={defaultHandlers.onSaveProfile}
        />
      );

      const fileInput = screen.getByLabelText('Avatar');
      fireEvent.change(fileInput, { target: { files: [] } });

      expect(onAvatarPick).not.toHaveBeenCalled();
    });

    it('should render avatar preview image when preview exists', () => {
      const mockFile = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });

      render(
        <ProfileEditor
          {...defaultProps}
          pendingAvatar={mockFile}
          avatarPreview="blob:test-url"
          {...defaultHandlers}
        />
      );

      const previewImage = screen.getByRole('img', { name: 'Avatar preview' });
      expect(previewImage).toBeInTheDocument();
      expect(previewImage).toHaveAttribute('src', 'blob:test-url');
    });

    it('should not render avatar preview image when no preview', () => {
      const mockFile = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });

      render(
        <ProfileEditor
          {...defaultProps}
          pendingAvatar={mockFile}
          avatarPreview=""
          {...defaultHandlers}
        />
      );

      expect(screen.queryByRole('img', { name: 'Avatar preview' })).not.toBeInTheDocument();
    });
  });

  describe('crop controls', () => {
    it('should call onCropChange when zoom slider changes', () => {
      const onCropChange = vi.fn();
      const mockFile = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });

      render(
        <ProfileEditor
          {...defaultProps}
          pendingAvatar={mockFile}
          avatarPreview="blob:test-url"
          onAvatarPick={defaultHandlers.onAvatarPick}
          onApplyAvatar={defaultHandlers.onApplyAvatar}
          onCancelAvatar={defaultHandlers.onCancelAvatar}
          onCropChange={onCropChange}
          onProfileFormChange={defaultHandlers.onProfileFormChange}
          onSaveProfile={defaultHandlers.onSaveProfile}
        />
      );

      const zoomSlider = screen.getByLabelText('Zoom');
      fireEvent.change(zoomSlider, { target: { value: '1.5' } });

      expect(onCropChange).toHaveBeenCalled();
    });

    it('should call onCropChange when horizontal slider changes', () => {
      const onCropChange = vi.fn();
      const mockFile = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });

      render(
        <ProfileEditor
          {...defaultProps}
          pendingAvatar={mockFile}
          avatarPreview="blob:test-url"
          onAvatarPick={defaultHandlers.onAvatarPick}
          onApplyAvatar={defaultHandlers.onApplyAvatar}
          onCancelAvatar={defaultHandlers.onCancelAvatar}
          onCropChange={onCropChange}
          onProfileFormChange={defaultHandlers.onProfileFormChange}
          onSaveProfile={defaultHandlers.onSaveProfile}
        />
      );

      const horizontalSlider = screen.getByLabelText('Horizontal');
      // Change from default 50 to 75
      fireEvent.change(horizontalSlider, { target: { value: '75' } });

      expect(onCropChange).toHaveBeenCalled();
    });

    it('should call onCropChange when vertical slider changes', () => {
      const onCropChange = vi.fn();
      const mockFile = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });

      render(
        <ProfileEditor
          {...defaultProps}
          pendingAvatar={mockFile}
          avatarPreview="blob:test-url"
          onAvatarPick={defaultHandlers.onAvatarPick}
          onApplyAvatar={defaultHandlers.onApplyAvatar}
          onCancelAvatar={defaultHandlers.onCancelAvatar}
          onCropChange={onCropChange}
          onProfileFormChange={defaultHandlers.onProfileFormChange}
          onSaveProfile={defaultHandlers.onSaveProfile}
        />
      );

      const verticalSlider = screen.getByLabelText('Vertical');
      // Change from default 50 to 25
      fireEvent.change(verticalSlider, { target: { value: '25' } });

      expect(onCropChange).toHaveBeenCalled();
    });

    it('should apply crop transform to preview image', () => {
      const mockFile = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });
      const crop = { scale: 1.5, offsetX: 30, offsetY: 40 };

      render(
        <ProfileEditor
          {...defaultProps}
          pendingAvatar={mockFile}
          avatarPreview="blob:test-url"
          crop={crop}
          {...defaultHandlers}
        />
      );

      const previewImage = screen.getByRole('img', { name: 'Avatar preview' });
      expect(previewImage).toHaveStyle({ transform: 'scale(1.5)' });
    });
  });

  describe('apply avatar', () => {
    it('should render apply avatar button when pending avatar exists', () => {
      const mockFile = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });

      render(
        <ProfileEditor
          {...defaultProps}
          pendingAvatar={mockFile}
          avatarPreview="blob:test-url"
          {...defaultHandlers}
        />
      );

      expect(screen.getByRole('button', { name: 'Apply cropped avatar' })).toBeInTheDocument();
    });

    it('should call onApplyAvatar when clicking apply button', async () => {
      const user = userEvent.setup();
      const onApplyAvatar = vi.fn();
      const mockFile = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });

      render(
        <ProfileEditor
          {...defaultProps}
          pendingAvatar={mockFile}
          avatarPreview="blob:test-url"
          onAvatarPick={defaultHandlers.onAvatarPick}
          onApplyAvatar={onApplyAvatar}
          onCancelAvatar={defaultHandlers.onCancelAvatar}
          onCropChange={defaultHandlers.onCropChange}
          onProfileFormChange={defaultHandlers.onProfileFormChange}
          onSaveProfile={defaultHandlers.onSaveProfile}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Apply cropped avatar' }));

      expect(onApplyAvatar).toHaveBeenCalledTimes(1);
    });

    it('should disable apply button when busy with avatar', () => {
      const mockFile = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });

      render(
        <ProfileEditor
          {...defaultProps}
          pendingAvatar={mockFile}
          avatarPreview="blob:test-url"
          busy="avatar"
          {...defaultHandlers}
        />
      );

      expect(screen.getByRole('button', { name: 'Uploading avatar...' })).toBeDisabled();
    });

    it('should show uploading text when busy with avatar', () => {
      const mockFile = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });

      render(
        <ProfileEditor
          {...defaultProps}
          pendingAvatar={mockFile}
          avatarPreview="blob:test-url"
          busy="avatar"
          {...defaultHandlers}
        />
      );

      expect(screen.getByRole('button', { name: 'Uploading avatar...' })).toBeInTheDocument();
    });
  });

  describe('cancel avatar', () => {
    it('should render cancel button when pending avatar exists', () => {
      const mockFile = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });

      render(
        <ProfileEditor
          {...defaultProps}
          pendingAvatar={mockFile}
          avatarPreview="blob:test-url"
          {...defaultHandlers}
        />
      );

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('should call onCancelAvatar when clicking cancel button', async () => {
      const user = userEvent.setup();
      const onCancelAvatar = vi.fn();
      const mockFile = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });

      render(
        <ProfileEditor
          {...defaultProps}
          pendingAvatar={mockFile}
          avatarPreview="blob:test-url"
          onAvatarPick={defaultHandlers.onAvatarPick}
          onApplyAvatar={defaultHandlers.onApplyAvatar}
          onCancelAvatar={onCancelAvatar}
          onCropChange={defaultHandlers.onCropChange}
          onProfileFormChange={defaultHandlers.onProfileFormChange}
          onSaveProfile={defaultHandlers.onSaveProfile}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onCancelAvatar).toHaveBeenCalledTimes(1);
    });
  });

  describe('form fields', () => {
    it('should call onProfileFormChange when nickname changes', async () => {
      const user = userEvent.setup();
      const onProfileFormChange = vi.fn();

      render(
        <ProfileEditor
          {...defaultProps}
          onAvatarPick={defaultHandlers.onAvatarPick}
          onApplyAvatar={defaultHandlers.onApplyAvatar}
          onCancelAvatar={defaultHandlers.onCancelAvatar}
          onCropChange={defaultHandlers.onCropChange}
          onProfileFormChange={onProfileFormChange}
          onSaveProfile={defaultHandlers.onSaveProfile}
        />
      );

      await user.type(screen.getByLabelText('Nickname'), 'New');

      expect(onProfileFormChange).toHaveBeenCalled();
    });

    it('should call onProfileFormChange when bio changes', async () => {
      const user = userEvent.setup();
      const onProfileFormChange = vi.fn();

      render(
        <ProfileEditor
          {...defaultProps}
          onAvatarPick={defaultHandlers.onAvatarPick}
          onApplyAvatar={defaultHandlers.onApplyAvatar}
          onCancelAvatar={defaultHandlers.onCancelAvatar}
          onCropChange={defaultHandlers.onCropChange}
          onProfileFormChange={onProfileFormChange}
          onSaveProfile={defaultHandlers.onSaveProfile}
        />
      );

      await user.type(screen.getByLabelText('Bio'), 'New bio content');

      expect(onProfileFormChange).toHaveBeenCalled();
    });

    it('should call onProfileFormChange when password changes', async () => {
      const user = userEvent.setup();
      const onProfileFormChange = vi.fn();

      render(
        <ProfileEditor
          {...defaultProps}
          onAvatarPick={defaultHandlers.onAvatarPick}
          onApplyAvatar={defaultHandlers.onApplyAvatar}
          onCancelAvatar={defaultHandlers.onCancelAvatar}
          onCropChange={defaultHandlers.onCropChange}
          onProfileFormChange={onProfileFormChange}
          onSaveProfile={defaultHandlers.onSaveProfile}
        />
      );

      await user.type(screen.getByLabelText('New password'), 'newpassword');

      expect(onProfileFormChange).toHaveBeenCalled();
    });
  });

  describe('save profile', () => {
    it('should call onSaveProfile when clicking save button', async () => {
      const user = userEvent.setup();
      const onSaveProfile = vi.fn();

      render(
        <ProfileEditor
          {...defaultProps}
          onAvatarPick={defaultHandlers.onAvatarPick}
          onApplyAvatar={defaultHandlers.onApplyAvatar}
          onCancelAvatar={defaultHandlers.onCancelAvatar}
          onCropChange={defaultHandlers.onCropChange}
          onProfileFormChange={defaultHandlers.onProfileFormChange}
          onSaveProfile={onSaveProfile}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Save profile' }));

      expect(onSaveProfile).toHaveBeenCalledTimes(1);
    });

    it('should disable save button when busy with profile', () => {
      render(
        <ProfileEditor
          {...defaultProps}
          busy="profile"
          {...defaultHandlers}
        />
      );

      expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
    });

    it('should show saving text when busy with profile', () => {
      render(
        <ProfileEditor
          {...defaultProps}
          busy="profile"
          {...defaultHandlers}
        />
      );

      expect(screen.getByRole('button', { name: 'Saving...' })).toBeInTheDocument();
    });

    it('should disable save button when busy with avatar', () => {
      render(
        <ProfileEditor
          {...defaultProps}
          busy="avatar"
          {...defaultHandlers}
        />
      );

      expect(screen.getByRole('button', { name: 'Save profile' })).toBeDisabled();
    });
  });

  describe('edge cases', () => {
    it('should handle empty profile form', () => {
      render(
        <ProfileEditor
          {...defaultProps}
          profileForm={{ nickname: '', bio: '', password: '' }}
          {...defaultHandlers}
        />
      );

      expect(screen.getByLabelText('Nickname')).toHaveValue('');
      expect(screen.getByLabelText('Bio')).toHaveValue('');
    });

    it('should handle long bio content', () => {
      const longBio = 'A'.repeat(500);

      render(
        <ProfileEditor
          {...defaultProps}
          profileForm={{ nickname: 'Test', bio: longBio, password: '' }}
          {...defaultHandlers}
        />
      );

      expect(screen.getByLabelText('Bio')).toHaveValue(longBio);
    });

    it('should handle special characters in nickname', () => {
      const specialNickname = "Test @#$% User";

      render(
        <ProfileEditor
          {...defaultProps}
          profileForm={{ nickname: specialNickname, bio: '', password: '' }}
          {...defaultHandlers}
        />
      );

      expect(screen.getByLabelText('Nickname')).toHaveValue(specialNickname);
    });
  });
});
