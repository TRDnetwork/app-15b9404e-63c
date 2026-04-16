// Realtime module for TaskFlow Pro

let channels = [];

// Subscribe to realtime changes for all user-facing tables
export function setupRealtime(supabase, onChange) {
    if (!supabase) return;
    
    // Clean up any existing channels
    teardownRealtime();
    
    // Subscribe to tasks table
    const tasksChannel = supabase
        .channel('app_e590_tasks_changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'app_e590_tasks'
            },
            (payload) => {
                console.log('Realtime update received:', payload);
                onChange({
                    eventType: payload.eventType,
                    new: payload.new,
                    old: payload.old
                });
            }
        )
        .subscribe((status) => {
            console.log('Realtime subscription status:', status);
        });
    
    channels.push(tasksChannel);
    
    return channels;
}

// Remove all realtime subscriptions
export function teardownRealtime() {
    channels.forEach(channel => {
        channel.unsubscribe();
    });
    channels = [];
}