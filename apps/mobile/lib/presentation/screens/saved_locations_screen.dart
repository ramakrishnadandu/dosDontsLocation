import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/utils/google_maps_link.dart';
import '../../data/repositories/saved_location_repository.dart';
import '../../domain/entities/saved_location.dart';
import 'add_saved_location_screen.dart';

/// Section 48: saved/"interested" locations - places favorited from search
/// results/details, or added directly by pasting a Google Maps link.
class SavedLocationsScreen extends StatefulWidget {
  const SavedLocationsScreen({super.key});

  @override
  State<SavedLocationsScreen> createState() => _SavedLocationsScreenState();
}

class _SavedLocationsScreenState extends State<SavedLocationsScreen> {
  List<SavedLocation> _items = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      _items = await context.read<SavedLocationRepository>().list();
    } catch (e) {
      _error = e.toString();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _delete(SavedLocation item) async {
    try {
      await context.read<SavedLocationRepository>().delete(item.id);
      setState(() => _items.removeWhere((i) => i.id == item.id));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Could not remove: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Saved places')),
      floatingActionButton: FloatingActionButton.extended(
        icon: const Icon(Icons.add_location_alt_outlined),
        label: const Text('Add place'),
        onPressed: () async {
          final added = await Navigator.of(context).push<bool>(
            MaterialPageRoute(builder: (_) => const AddSavedLocationScreen()),
          );
          if (added == true) _load();
        },
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? Center(child: Text(_error!))
                : _items.isEmpty
                    ? ListView(
                        children: const [
                          Padding(
                            padding: EdgeInsets.all(32),
                            child: Center(
                              child: Text(
                                'No saved places yet.\nTap "Add place" to favorite somewhere, or paste a Google Maps link.',
                                textAlign: TextAlign.center,
                              ),
                            ),
                          ),
                        ],
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(12),
                        itemCount: _items.length,
                        itemBuilder: (context, index) {
                          final item = _items[index];
                          return Card(
                            child: ListTile(
                              leading: const CircleAvatar(child: Icon(Icons.bookmark)),
                              title: Text(item.label),
                              subtitle: item.note != null && item.note!.isNotEmpty ? Text(item.note!) : null,
                              trailing: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  if (item.hasCoordinates || item.sourceUrl != null)
                                    IconButton(
                                      tooltip: 'Open in Google Maps',
                                      icon: const Icon(Icons.map_outlined),
                                      onPressed: () {
                                        final url = item.sourceUrl ??
                                            buildGoogleMapsUrl(latitude: item.latitude, longitude: item.longitude, name: item.label);
                                        launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
                                      },
                                    ),
                                  IconButton(
                                    tooltip: 'Remove',
                                    icon: const Icon(Icons.delete_outline),
                                    onPressed: () => _delete(item),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
      ),
    );
  }
}
