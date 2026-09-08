import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import '../../application/location_controller.dart';
import '../../core/utils/category_style.dart';
import '../../core/utils/google_maps_link.dart';
import '../../data/repositories/community_repository.dart';
import '../../data/repositories/saved_location_repository.dart';
import '../../domain/entities/community_opinion.dart';
import '../../domain/entities/location_entity.dart';
import '../widgets/evidence_card.dart';
import 'add_opinion_screen.dart';
import 'report_content_screen.dart';
import 'sign_in_screen.dart';

/// Location Details / Location Intelligence (sections 3 & 28). Visually
/// prioritizes Overview, DO, CONSIDER, WATCH, SPENDING, MUST_SEE, PRODUCTS,
/// COMMUNITY in that order, exactly as the product spec's screen list
/// requires - each recommendation renders via EvidenceCard so its
/// FACT/REVIEW_SIGNAL/COMMUNITY_OPINION/AI_INTERPRETATION provenance is
/// always visible.
class LocationDetailsScreen extends StatefulWidget {
  final String entityId;

  const LocationDetailsScreen({super.key, required this.entityId});

  @override
  State<LocationDetailsScreen> createState() => _LocationDetailsScreenState();
}

class _LocationDetailsScreenState extends State<LocationDetailsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<LocationController>().loadDetails(widget.entityId);
    });
  }

  Future<void> _checkIn(String visitRecency) async {
    try {
      await context.read<CommunityRepository>().checkIn(entityId: widget.entityId, visitRecency: visitRecency);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Thanks for checking in!')));
      }
    } catch (e) {
      if (!mounted) return;
      if (e.toString().contains('401')) {
        final signedIn = await Navigator.of(context).push<bool>(MaterialPageRoute(builder: (_) => const SignInScreen()));
        if (signedIn == true) await _checkIn(visitRecency);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Could not check in: $e')));
      }
    }
  }

  Future<void> _save(LocationEntity entity) async {
    try {
      await context.read<SavedLocationRepository>().add(entityId: entity.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Saved "${entity.name}" to your places')));
      }
    } catch (e) {
      if (!mounted) return;
      if (e.toString().contains('401')) {
        final signedIn = await Navigator.of(context).push<bool>(MaterialPageRoute(builder: (_) => const SignInScreen()));
        if (signedIn == true) await _save(entity);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Could not save: $e')));
      }
    }
  }

  void _share(LocationEntity entity) {
    final mapsUrl = buildGoogleMapsUrl(latitude: entity.latitude, longitude: entity.longitude, name: entity.name);
    Share.share('${entity.name}\n$mapsUrl', subject: entity.name);
  }

  void _showCheckInSheet() {
    showModalBottomSheet(
      context: context,
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const ListTile(title: Text('When did you visit?')),
            ListTile(title: const Text('Today'), onTap: () { Navigator.pop(context); _checkIn('TODAY'); }),
            ListTile(title: const Text('This week'), onTap: () { Navigator.pop(context); _checkIn('THIS_WEEK'); }),
            ListTile(title: const Text('Earlier'), onTap: () { Navigator.pop(context); _checkIn('EARLIER'); }),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<LocationController>();
    final entity = controller.selectedEntity;

    if (controller.detailsStatus == LoadStatus.loading || entity == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (controller.detailsStatus == LoadStatus.error) {
      return Scaffold(body: Center(child: Text('Could not load this place: ${controller.errorMessage}')));
    }

    return Scaffold(
      appBar: AppBar(
        actions: [
          IconButton(
            tooltip: 'Save to my places',
            icon: const Icon(Icons.bookmark_add_outlined),
            onPressed: () => _save(entity),
          ),
          IconButton(
            tooltip: 'Share',
            icon: const Icon(Icons.share_outlined),
            onPressed: () => _share(entity),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showCheckInSheet,
        icon: const Icon(Icons.location_on),
        label: const Text('I was here'),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        children: [
          _HeroHeader(entity: entity),
          if (entity.isDemoData) const _DemoBanner(),
          const _SectionHeader('Do', Icons.check_circle_outline),
          ..._sectionOrEmpty(controller, 'DO'),
          const _SectionHeader('Consider', Icons.info_outline),
          ..._sectionOrEmpty(controller, 'CONSIDER'),
          const _SectionHeader('Watch', Icons.visibility_outlined),
          ..._sectionOrEmpty(controller, 'WATCH'),
          const _SectionHeader('Spending', Icons.payments_outlined),
          ..._sectionOrEmpty(controller, 'SPENDING'),
          const _SectionHeader('Must see', Icons.star_border),
          ..._sectionOrEmpty(controller, 'MUST_SEE'),
          const _SectionHeader('Products', Icons.shopping_bag_outlined),
          ..._sectionOrEmpty(controller, 'PRODUCTS'),
          const _SectionHeader('Health aware', Icons.health_and_safety_outlined),
          ..._sectionOrEmpty(controller, 'HEALTH_AWARE'),
          const _SectionHeader('General tips', Icons.lightbulb_outline),
          ..._sectionOrEmpty(controller, 'GENERAL_TIPS'),
          const _SectionHeader('Community', Icons.groups_outlined),
          ...controller.opinions.map((o) => _OpinionTile(opinion: o)),
          if (controller.opinions.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 8),
              child: Text('No community opinions yet - be the first.'),
            ),
          const SizedBox(height: 12),
          FilledButton.tonalIcon(
            icon: const Icon(Icons.rate_review_outlined),
            label: const Text('Add your opinion'),
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => AddOpinionScreen(entityId: widget.entityId)),
            ),
          ),
          const SizedBox(height: 80),
        ],
      ),
    );
  }

  List<Widget> _sectionOrEmpty(LocationController controller, String category) {
    final items = controller.byCategory(category);
    if (items.isEmpty) {
      return [const Padding(padding: EdgeInsets.symmetric(vertical: 4), child: Text('Information not available from the current sources.'))];
    }
    return items.map((e) => EvidenceCard(evidence: e)).toList();
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final IconData icon;
  const _SectionHeader(this.title, this.icon);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 20, bottom: 8),
      child: Row(
        children: [
          Icon(icon, size: 20, color: Theme.of(context).colorScheme.primary),
          const SizedBox(width: 8),
          Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}

class _HeroHeader extends StatelessWidget {
  final LocationEntity entity;
  const _HeroHeader({required this.entity});

  @override
  Widget build(BuildContext context) {
    final style = CategoryStyle.of(entity.category);
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [style.color.withValues(alpha: 0.85), style.color.withValues(alpha: 0.55)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(radius: 26, backgroundColor: Colors.white.withValues(alpha: 0.25), child: Icon(style.icon, color: Colors.white, size: 26)),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      entity.name,
                      style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
                    ),
                    Text(humanizeCategory(entity.category), style: const TextStyle(color: Colors.white70)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              if (entity.rating != null)
                _HeroChip(icon: Icons.star, label: '${entity.rating} (${entity.reviewCount ?? 0})'),
              if (entity.address != null) _HeroChip(icon: Icons.place_outlined, label: entity.address!),
              if (entity.accessibility.isNotEmpty)
                _HeroChip(icon: Icons.accessible_outlined, label: entity.accessibility.join(', ')),
            ],
          ),
        ],
      ),
    );
  }
}

class _HeroChip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _HeroChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(12)),
      constraints: const BoxConstraints(maxWidth: 260),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: Colors.white),
          const SizedBox(width: 4),
          Flexible(child: Text(label, style: const TextStyle(color: Colors.white, fontSize: 12), overflow: TextOverflow.ellipsis)),
        ],
      ),
    );
  }
}

class _DemoBanner extends StatelessWidget {
  const _DemoBanner();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(8),
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(color: Colors.amber.shade100, borderRadius: BorderRadius.circular(8)),
      child: const Text('Demo data - not a real place', style: TextStyle(fontWeight: FontWeight.w600)),
    );
  }
}

/// Section 6 (Community Reputation): lets a viewer mark an opinion Helpful/
/// Not Helpful, or Report it - all three actually call the API (they used
/// to not exist at all / be a fake success message, see report_content_screen.dart).
/// Popularity (helpful votes) is displayed but never conflated with factual
/// reliability - it's just a count, not a verification badge.
class _OpinionTile extends StatefulWidget {
  final CommunityOpinion opinion;
  const _OpinionTile({required this.opinion});

  @override
  State<_OpinionTile> createState() => _OpinionTileState();
}

class _OpinionTileState extends State<_OpinionTile> {
  late int _helpfulCount = widget.opinion.helpfulCount;
  String? _myVote; // 'HELPFUL' | 'NOT_HELPFUL' | 'REPORT', client-side only, resets on screen reload

  Future<void> _vote(String voteType) async {
    if (_myVote == voteType) return;
    try {
      await context.read<CommunityRepository>().vote(opinionId: widget.opinion.id, voteType: voteType);
      setState(() {
        if (voteType == 'HELPFUL') _helpfulCount++;
        _myVote = voteType;
      });
    } catch (e) {
      if (!mounted) return;
      if (e.toString().contains('401')) {
        final signedIn = await Navigator.of(context).push<bool>(MaterialPageRoute(builder: (_) => const SignInScreen()));
        if (signedIn == true) await _vote(voteType);
      } else if (e.toString().contains('409')) {
        setState(() => _myVote = voteType); // already voted server-side - reflect that locally
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Could not record vote: $e')));
      }
    }
  }

  Future<void> _report() async {
    final reported = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => ReportContentScreen(opinionId: widget.opinion.id)),
    );
    if (reported == true && mounted) setState(() => _myVote = 'REPORT');
  }

  @override
  Widget build(BuildContext context) {
    final o = widget.opinion;
    return Card(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(4, 4, 4, 0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ListTile(
              leading: CircleAvatar(child: Text('${o.rating}★', style: const TextStyle(fontSize: 11))),
              title: Text(o.title ?? 'Community opinion'),
              subtitle: Text(o.body ?? o.tips.join(' · ')),
            ),
            Padding(
              padding: const EdgeInsets.only(left: 8, right: 8, bottom: 4),
              child: Row(
                children: [
                  TextButton.icon(
                    onPressed: () => _vote('HELPFUL'),
                    icon: Icon(_myVote == 'HELPFUL' ? Icons.thumb_up : Icons.thumb_up_outlined, size: 16),
                    label: Text('Helpful ($_helpfulCount)'),
                  ),
                  TextButton.icon(
                    onPressed: () => _vote('NOT_HELPFUL'),
                    icon: Icon(_myVote == 'NOT_HELPFUL' ? Icons.thumb_down : Icons.thumb_down_outlined, size: 16),
                    label: const Text('Not helpful'),
                  ),
                  const Spacer(),
                  IconButton(
                    tooltip: 'Report',
                    onPressed: _myVote == 'REPORT' ? null : _report,
                    icon: Icon(Icons.flag_outlined, size: 18, color: _myVote == 'REPORT' ? Colors.grey : null),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

