import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../application/auth_controller.dart';
import '../../data/repositories/preferences_repository.dart';
import '../../core/network/api_client.dart';

/// Section 18: explicit privacy controls, surfaced directly in-app rather
/// than only in a policy document.
class PrivacyScreen extends StatelessWidget {
  const PrivacyScreen({super.key});

  Future<void> _exportData(BuildContext context) async {
    try {
      final client = context.read<ApiClient>();
      await client.get('/users/me/export');
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Export ready - check your account email (demo: printed to API logs).')),
        );
      }
    } catch (e) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Export failed: $e')));
    }
  }

  Future<void> _confirmDelete(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Delete your data?'),
        content: const Text(
          'This deletes your account and personalization data. Your past community '
          'opinions remain visible to help other users, but are no longer linked to '
          'your identity in the public view. This cannot be undone.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Delete')),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;
    final apiClient = context.read<ApiClient>();
    final auth = context.read<AuthController>();
    try {
      await apiClient.delete('/users/me');
      await auth.logout();
    } catch (e) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Delete failed: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Privacy')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'LocaGuide only ever stores the coarse "visit recency" you choose when you '
            'check in (Today / This week / Earlier) - never precise GPS history. '
            'See the full privacy policy for details.',
          ),
          const SizedBox(height: 16),
          ListTile(
            leading: const Icon(Icons.download_outlined),
            title: const Text('Export my data'),
            onTap: () => _exportData(context),
          ),
          ListTile(
            leading: const Icon(Icons.tune),
            title: const Text('Reset personalization data'),
            onTap: () => context.read<PreferencesRepository>().reset(),
          ),
          ListTile(
            leading: const Icon(Icons.delete_outline, color: Colors.red),
            title: const Text('Delete my account', style: TextStyle(color: Colors.red)),
            onTap: () => _confirmDelete(context),
          ),
        ],
      ),
    );
  }
}
