import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:provider/provider.dart';
import '../../application/location_controller.dart';
import '../../core/utils/category_style.dart';
import '../../domain/entities/location_entity.dart';
import 'location_details_screen.dart';
import 'map_screen.dart';
import 'saved_locations_screen.dart';
import 'search_screen.dart';
import 'product_search_screen.dart';
import 'profile_screen.dart';

/// Springfield demo coordinates - matches the entities in
/// packages/providers/src/location/demoData.ts, so "view demo places"
/// always finds something regardless of the device's real GPS position.
const double kDemoLat = 17.4239;
const double kDemoLng = 78.4738;

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  double _lat = kDemoLat;
  double _lng = kDemoLng;
  bool _usingDemoLocation = true;
  String? _selectedCategory;

  static const _categoryFilters = <String>[
    'SHOPPING_MALL',
    'RESTAURANT',
    'HOTEL',
    'TOURIST_ATTRACTION',
    'HOSPITAL',
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    try {
      final position = await Geolocator.getCurrentPosition();
      _lat = position.latitude;
      _lng = position.longitude;
      _usingDemoLocation = false;
    } catch (_) {
      // Permission denied or unavailable (e.g. simulator/emulator, or a web
      // browser that blocked the prompt) - fall back to the demo location
      // so the app remains genuinely useful rather than showing an error.
      _lat = kDemoLat;
      _lng = kDemoLng;
      _usingDemoLocation = true;
    }
    if (!mounted) return;
    await context.read<LocationController>().loadNearby(lat: _lat, lng: _lng);
  }

  Future<void> _loadDemoLocation() async {
    setState(() {
      _lat = kDemoLat;
      _lng = kDemoLng;
      _usingDemoLocation = true;
    });
    await context.read<LocationController>().loadNearby(lat: _lat, lng: _lng, radiusMeters: 5000);
  }

  List<LocationEntity> _filtered(List<LocationEntity> items) {
    if (_selectedCategory == null) return items;
    return items.where((e) => e.category == _selectedCategory).toList();
  }

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<LocationController>();
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('LocaGuide'),
        actions: [
          IconButton(
            tooltip: 'Saved places',
            icon: const Icon(Icons.bookmark_outline),
            onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SavedLocationsScreen())),
          ),
          IconButton(
            tooltip: 'Products',
            icon: const Icon(Icons.shopping_bag_outlined),
            onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ProductSearchScreen())),
          ),
          IconButton(
            tooltip: 'Profile',
            icon: const Icon(Icons.person_outline),
            onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ProfileScreen())),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
                child: Row(
                  children: [
                    Expanded(
                      child: InkWell(
                        borderRadius: BorderRadius.circular(16),
                        onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SearchScreen())),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                          decoration: BoxDecoration(
                            color: scheme.surfaceContainerHighest,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.search, color: scheme.onSurfaceVariant),
                              const SizedBox(width: 10),
                              Text('Search a place, category, or address', style: TextStyle(color: scheme.onSurfaceVariant)),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton.filledTonal(
                      tooltip: 'Map view',
                      icon: const Icon(Icons.map_outlined),
                      onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => MapScreen(lat: _lat, lng: _lng))),
                    ),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 44,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  children: [
                    _CategoryChip(
                      label: 'All',
                      icon: Icons.apps,
                      selected: _selectedCategory == null,
                      onTap: () => setState(() => _selectedCategory = null),
                    ),
                    for (final category in _categoryFilters)
                      Padding(
                        padding: const EdgeInsets.only(left: 8),
                        child: _CategoryChip(
                          label: humanizeCategory(category),
                          icon: CategoryStyle.of(category).icon,
                          selected: _selectedCategory == category,
                          onTap: () => setState(() => _selectedCategory = category),
                        ),
                      ),
                  ],
                ),
              ),
            ),
            if (_usingDemoLocation)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: scheme.tertiaryContainer, borderRadius: BorderRadius.circular(14)),
                    child: Row(
                      children: [
                        Icon(Icons.info_outline, size: 18, color: scheme.onTertiaryContainer),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Showing demo places near Hyderabad - your device location wasn\'t used.',
                            style: TextStyle(color: scheme.onTertiaryContainer, fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            _buildNearbySliver(controller),
          ],
        ),
      ),
    );
  }

  Widget _buildNearbySliver(LocationController controller) {
    if (controller.nearbyStatus == LoadStatus.loading) {
      return const SliverFillRemaining(child: Center(child: CircularProgressIndicator()));
    }
    if (controller.nearbyStatus == LoadStatus.error) {
      return SliverFillRemaining(
        child: Center(child: Text('Could not load nearby places: ${controller.errorMessage}')),
      );
    }
    final items = _filtered(controller.nearby);
    if (items.isEmpty) {
      return SliverFillRemaining(
        hasScrollBody: false,
        child: _EmptyNearbyState(onTryDemo: _loadDemoLocation, onSearchManually: () {
          Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SearchScreen()));
        }),
      );
    }
    return SliverPadding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      sliver: SliverList.separated(
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (context, index) {
          final entity = items[index];
          final distanceMeters = Geolocator.distanceBetween(_lat, _lng, entity.latitude, entity.longitude);
          return _EntityCard(entity: entity, distanceMeters: distanceMeters);
        },
      ),
    );
  }
}

class _CategoryChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  const _CategoryChip({required this.label, required this.icon, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ChoiceChip(
      avatar: Icon(icon, size: 18),
      label: Text(label),
      selected: selected,
      onSelected: (_) => onTap(),
    );
  }
}

class _EmptyNearbyState extends StatelessWidget {
  final VoidCallback onTryDemo;
  final VoidCallback onSearchManually;

  const _EmptyNearbyState({required this.onTryDemo, required this.onSearchManually});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.explore_off_outlined, size: 56, color: Theme.of(context).colorScheme.outline),
            const SizedBox(height: 16),
            Text('No nearby places found', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            const Text(
              'Nothing in the demo dataset is near your current location.',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: onTryDemo,
              icon: const Icon(Icons.travel_explore),
              label: const Text('View demo places (Hyderabad)'),
            ),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: onSearchManually,
              icon: const Icon(Icons.search),
              label: const Text('Search manually'),
            ),
          ],
        ),
      ),
    );
  }
}

class _EntityCard extends StatelessWidget {
  final LocationEntity entity;
  final double distanceMeters;

  const _EntityCard({required this.entity, required this.distanceMeters});

  String get _distanceLabel =>
      distanceMeters >= 1000 ? '${(distanceMeters / 1000).toStringAsFixed(1)} km' : '${distanceMeters.round()} m';

  @override
  Widget build(BuildContext context) {
    final style = CategoryStyle.of(entity.category);
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => LocationDetailsScreen(entityId: entity.id))),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(color: style.color.withValues(alpha: 0.15), shape: BoxShape.circle),
                child: Icon(style.icon, color: style.color),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(entity.name, style: const TextStyle(fontWeight: FontWeight.w600), maxLines: 1, overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 2),
                    Text(
                      '${humanizeCategory(entity.category)} · $_distanceLabel${entity.isDemoData ? ' · Demo' : ''}',
                      style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant, fontSize: 13),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              if (entity.rating != null) ...[
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.amber.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.star, size: 14, color: Colors.amber),
                      const SizedBox(width: 2),
                      Text('${entity.rating}', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
