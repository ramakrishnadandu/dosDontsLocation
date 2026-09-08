import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../application/location_controller.dart';
import 'location_details_screen.dart';

/// PLACEHOLDER map screen (section 13). Rendering an actual interactive map
/// needs a map SDK (google_maps_flutter / mapbox_gl) plus platform API keys
/// and native project configuration (Android/iOS Gradle & Info.plist
/// entries) that cannot be verified without the Flutter/Android/Xcode
/// toolchains, which are unavailable in this environment. The data flow
/// (nearby entities, category filter, tap-through to details) is real and
/// wired to the API; swap the body's ListView for a `GoogleMap` widget with
/// markers built from the same `nearby` list once a map SDK is integrated.
class MapScreen extends StatelessWidget {
  final double lat;
  final double lng;

  const MapScreen({super.key, required this.lat, required this.lng});

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<LocationController>();
    return Scaffold(
      appBar: AppBar(title: const Text('Map (list view)')),
      body: Column(
        children: [
          Container(
            width: double.infinity,
            color: Theme.of(context).colorScheme.surfaceContainerHighest,
            padding: const EdgeInsets.all(16),
            child: Text(
              'Map rendering requires a map SDK integration (see file header comment). '
              'Showing nearby places as a list, centered on (${lat.toStringAsFixed(4)}, ${lng.toStringAsFixed(4)}).',
            ),
          ),
          Expanded(
            child: ListView.builder(
              itemCount: controller.nearby.length,
              itemBuilder: (context, index) {
                final entity = controller.nearby[index];
                return ListTile(
                  leading: const Icon(Icons.place_outlined),
                  title: Text(entity.name),
                  subtitle: Text(entity.category.replaceAll('_', ' ')),
                  onTap: () => Navigator.of(context)
                      .push(MaterialPageRoute(builder: (_) => LocationDetailsScreen(entityId: entity.id))),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
