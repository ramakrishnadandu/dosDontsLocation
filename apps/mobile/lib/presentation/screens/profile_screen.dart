import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../application/auth_controller.dart';
import 'preferences_screen.dart';
import 'notifications_screen.dart';
import 'saved_locations_screen.dart';
import 'settings_screen.dart';
import 'sign_in_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        padding: const EdgeInsets.symmetric(vertical: 8),
        children: [
          Card(
            margin: const EdgeInsets.fromLTRB(16, 8, 16, 16),
            child: ListTile(
              contentPadding: const EdgeInsets.all(16),
              leading: CircleAvatar(
                radius: 24,
                backgroundColor: scheme.primaryContainer,
                child: Icon(Icons.person, color: scheme.onPrimaryContainer),
              ),
              title: Text(auth.isSignedIn ? 'Signed in' : 'Not signed in'),
              subtitle: Text(auth.isSignedIn ? 'Tap to sign out' : 'Sign in to save places and submit opinions'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => auth.isSignedIn
                  ? auth.logout()
                  : Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SignInScreen())),
            ),
          ),
          ListTile(
            leading: const Icon(Icons.bookmark_outline),
            title: const Text('Saved places'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SavedLocationsScreen())),
          ),
          ListTile(
            leading: const Icon(Icons.tune),
            title: const Text('Preferences'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const PreferencesScreen())),
          ),
          ListTile(
            leading: const Icon(Icons.notifications_outlined),
            title: const Text('Notifications'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const NotificationsScreen())),
          ),
          ListTile(
            leading: const Icon(Icons.settings_outlined),
            title: const Text('Settings'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SettingsScreen())),
          ),
        ],
      ),
    );
  }
}
