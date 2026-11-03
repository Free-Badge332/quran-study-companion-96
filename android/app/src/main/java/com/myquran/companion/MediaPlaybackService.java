package com.myquran.companion;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;
import android.os.IBinder;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;
import androidx.core.app.NotificationCompat;
import androidx.media.app.NotificationCompat.MediaStyle;

/** Foreground media service: background playback, lock-screen controls, audio focus. */
public class MediaPlaybackService extends Service {
    static final String ACTION_UPDATE = "com.myquran.companion.UPDATE";
    static final String ACTION_CONTROL = "com.myquran.companion.CONTROL";
    private static final String CHANNEL = "recitation";
    private static final int NOTIFICATION_ID = 7001;

    private MediaSessionCompat session;
    private AudioManager audioManager;
    private AudioFocusRequest focusRequest;
    private boolean hasFocus = false;
    private boolean pausedByFocusLoss = false;

    private final AudioManager.OnAudioFocusChangeListener focusListener = change -> {
        if (change == AudioManager.AUDIOFOCUS_LOSS || change == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) {
            pausedByFocusLoss = change == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT;
            if (change == AudioManager.AUDIOFOCUS_LOSS) hasFocus = false;
            MediaPlaybackPlugin.emit("pause");
        } else if (change == AudioManager.AUDIOFOCUS_GAIN && pausedByFocusLoss) {
            pausedByFocusLoss = false;
            MediaPlaybackPlugin.emit("play");
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        session = new MediaSessionCompat(this, "MyQuranRecitation");
        session.setCallback(new MediaSessionCompat.Callback() {
            @Override public void onPlay() { MediaPlaybackPlugin.emit("play"); }
            @Override public void onPause() { MediaPlaybackPlugin.emit("pause"); }
            @Override public void onSkipToNext() { MediaPlaybackPlugin.emit("next"); }
            @Override public void onSkipToPrevious() { MediaPlaybackPlugin.emit("previous"); }
            @Override public void onStop() { MediaPlaybackPlugin.emit("pause"); }
        });
        session.setActive(true);
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel ch = new NotificationChannel(CHANNEL, "Recitation", NotificationManager.IMPORTANCE_LOW);
            ch.setShowBadge(false);
            getSystemService(NotificationManager.class).createNotificationChannel(ch);
        }
    }

    private void requestFocus() {
        if (hasFocus) return;
        int result;
        if (Build.VERSION.SDK_INT >= 26) {
            focusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build())
                .setOnAudioFocusChangeListener(focusListener).build();
            result = audioManager.requestAudioFocus(focusRequest);
        } else {
            result = audioManager.requestAudioFocus(focusListener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN);
        }
        hasFocus = result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
    }

    private void abandonFocus() {
        if (Build.VERSION.SDK_INT >= 26 && focusRequest != null) audioManager.abandonAudioFocusRequest(focusRequest);
        else audioManager.abandonAudioFocus(focusListener);
        hasFocus = false;
    }

    private PendingIntent control(long action) {
        Intent i = new Intent(this, MediaPlaybackService.class).setAction(ACTION_CONTROL).putExtra("a", action);
        return PendingIntent.getService(this, (int) action, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_CONTROL.equals(intent.getAction())) {
            long a = intent.getLongExtra("a", 0);
            if (a == PlaybackStateCompat.ACTION_PLAY) MediaPlaybackPlugin.emit("play");
            else if (a == PlaybackStateCompat.ACTION_PAUSE) MediaPlaybackPlugin.emit("pause");
            else if (a == PlaybackStateCompat.ACTION_SKIP_TO_NEXT) MediaPlaybackPlugin.emit("next");
            else if (a == PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS) MediaPlaybackPlugin.emit("previous");
            return START_NOT_STICKY;
        }
        String title = intent != null ? intent.getStringExtra("title") : "My Quran";
        String artist = intent != null ? intent.getStringExtra("artist") : "";
        boolean playing = intent != null && intent.getBooleanExtra("playing", false);
        long position = intent != null ? (long) (intent.getDoubleExtra("position", 0) * 1000) : 0;
        long duration = intent != null ? (long) (intent.getDoubleExtra("duration", 0) * 1000) : 0;

        if (playing) { requestFocus(); pausedByFocusLoss = false; }

        session.setMetadata(new MediaMetadataCompat.Builder()
            .putString(MediaMetadataCompat.METADATA_KEY_TITLE, title)
            .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, artist)
            .putLong(MediaMetadataCompat.METADATA_KEY_DURATION, duration).build());
        session.setPlaybackState(new PlaybackStateCompat.Builder()
            .setActions(PlaybackStateCompat.ACTION_PLAY | PlaybackStateCompat.ACTION_PAUSE | PlaybackStateCompat.ACTION_PLAY_PAUSE
                | PlaybackStateCompat.ACTION_SKIP_TO_NEXT | PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS)
            .setState(playing ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED, position, playing ? 1f : 0f)
            .build());

        Intent open = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent content = PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_IMMUTABLE);
        Notification n = new NotificationCompat.Builder(this, CHANNEL)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(artist)
            .setContentIntent(content)
            .setOngoing(playing)
            .setSilent(true)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .addAction(android.R.drawable.ic_media_previous, "Previous", control(PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS))
            .addAction(playing ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play,
                playing ? "Pause" : "Play", control(playing ? PlaybackStateCompat.ACTION_PAUSE : PlaybackStateCompat.ACTION_PLAY))
            .addAction(android.R.drawable.ic_media_next, "Next", control(PlaybackStateCompat.ACTION_SKIP_TO_NEXT))
            .setStyle(new MediaStyle().setMediaSession(session.getSessionToken()).setShowActionsInCompactView(0, 1, 2))
            .build();

        if (Build.VERSION.SDK_INT >= 29) startForeground(NOTIFICATION_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        else startForeground(NOTIFICATION_ID, n);
        // While paused, let the user swipe the notification away; the service stays until stop().
        if (!playing && Build.VERSION.SDK_INT >= 24) stopForeground(STOP_FOREGROUND_DETACH);
        return START_NOT_STICKY;
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) { stopSelf(); }

    @Override
    public void onDestroy() {
        abandonFocus();
        session.setActive(false);
        session.release();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }
}
