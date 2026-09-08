import 'package:flutter/material.dart';

/// Section 47: notifications must be opt-in. No push provider is wired up
/// yet (see docs/product-requirements.md) - this screen shows the intended
/// preference toggles so the UI contract exists ahead of the backend work.
class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  bool _nearbyLocation = false;
  bool _recommendationUpdates = false;
  bool _communityResponses = true;
  bool _dealAlerts = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      body: ListView(
        children: [
          SwitchListTile(
            title: const Text('Nearby location alerts'),
            subtitle: const Text('Not yet delivered - no push provider configured'),
            value: _nearbyLocation,
            onChanged: (v) => setState(() => _nearbyLocation = v),
          ),
          SwitchListTile(
            title: const Text('Recommendation updates'),
            value: _recommendationUpdates,
            onChanged: (v) => setState(() => _recommendationUpdates = v),
          ),
          SwitchListTile(
            title: const Text('Community responses to my opinions'),
            value: _communityResponses,
            onChanged: (v) => setState(() => _communityResponses = v),
          ),
          SwitchListTile(
            title: const Text('Deal alerts'),
            value: _dealAlerts,
            onChanged: (v) => setState(() => _dealAlerts = v),
          ),
        ],
      ),
    );
  }
}
