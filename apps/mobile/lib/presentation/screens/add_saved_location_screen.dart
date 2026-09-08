import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../data/repositories/saved_location_repository.dart';

/// Section 48 + the "add/share an interested Google Maps location" feature:
/// paste a link copied from Google Maps' Share action (works for both full
/// links and short maps.app.goo.gl links - the backend resolves and parses
/// it, see packages/domain/src/googleMaps/parseGoogleMapsUrl.ts), or just
/// give it a name if you don't have a link handy.
class AddSavedLocationScreen extends StatefulWidget {
  const AddSavedLocationScreen({super.key});

  @override
  State<AddSavedLocationScreen> createState() => _AddSavedLocationScreenState();
}

class _AddSavedLocationScreenState extends State<AddSavedLocationScreen> {
  final _labelController = TextEditingController();
  final _linkController = TextEditingController();
  final _noteController = TextEditingController();
  bool _submitting = false;
  String? _error;

  Future<void> _submit() async {
    if (_labelController.text.trim().isEmpty && _linkController.text.trim().isEmpty) {
      setState(() => _error = 'Enter a name or paste a Google Maps link.');
      return;
    }
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await context.read<SavedLocationRepository>().add(
            label: _labelController.text.trim().isEmpty ? null : _labelController.text.trim(),
            sourceUrl: _linkController.text.trim().isEmpty ? null : _linkController.text.trim(),
            note: _noteController.text.trim().isEmpty ? null : _noteController.text.trim(),
          );
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Add a place')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.secondaryContainer,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                Icon(Icons.tips_and_updates_outlined, color: Theme.of(context).colorScheme.onSecondaryContainer),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'In Google Maps, tap Share on any place, choose "Copy link", then paste it below - '
                    'we\'ll pull out the name and coordinates automatically.',
                    style: TextStyle(color: Theme.of(context).colorScheme.onSecondaryContainer, fontSize: 13),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          TextField(
            controller: _linkController,
            keyboardType: TextInputType.url,
            decoration: const InputDecoration(
              labelText: 'Google Maps link',
              hintText: 'https://maps.app.goo.gl/... or https://www.google.com/maps/place/...',
              prefixIcon: Icon(Icons.link),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _labelController,
            decoration: const InputDecoration(labelText: 'Name (optional if you pasted a link)', prefixIcon: Icon(Icons.label_outline)),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _noteController,
            maxLines: 3,
            decoration: const InputDecoration(labelText: 'Why are you interested? (optional)', prefixIcon: Icon(Icons.notes)),
          ),
          const SizedBox(height: 20),
          if (_error != null) Padding(padding: const EdgeInsets.only(bottom: 12), child: Text(_error!, style: const TextStyle(color: Colors.red))),
          FilledButton.icon(
            onPressed: _submitting ? null : _submit,
            icon: _submitting
                ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.bookmark_add_outlined),
            label: const Text('Save'),
          ),
        ],
      ),
    );
  }
}
