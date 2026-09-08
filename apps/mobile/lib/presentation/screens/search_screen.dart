import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../application/location_controller.dart';
import '../../domain/entities/location_entity.dart';
import 'location_details_screen.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _controller = TextEditingController();
  List<LocationEntity> _results = [];
  bool _loading = false;
  String? _error;

  Future<void> _search(String query) async {
    if (query.trim().isEmpty) {
      setState(() => _results = []);
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await context.read<LocationController>().search(query);
      setState(() => _results = results);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _controller,
          autofocus: true,
          decoration: const InputDecoration(hintText: 'Search a place, category, or address', border: InputBorder.none),
          onSubmitted: _search,
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : ListView.builder(
                  itemCount: _results.length,
                  itemBuilder: (context, index) {
                    final entity = _results[index];
                    return ListTile(
                      title: Text(entity.name),
                      subtitle: Text(entity.address ?? entity.category),
                      onTap: () => Navigator.of(context)
                          .push(MaterialPageRoute(builder: (_) => LocationDetailsScreen(entityId: entity.id))),
                    );
                  },
                ),
    );
  }
}
