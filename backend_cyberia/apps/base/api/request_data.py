import json


def _media_request_data(request):
    data = {key: request.data.get(key) for key in request.data}
    sources = data.get('sources')
    if isinstance(sources, str):
        try:
            data['sources'] = json.loads(sources)
        except json.JSONDecodeError:
            pass
    return data


def _meal_request_data(request):
    data = {key: request.data.get(key) for key in request.data}
    if 'time' in data and not data['time']:
        data['time'] = None
    for field in ('tags', 'items'):
        value = data.get(field)
        if isinstance(value, str):
            try:
                data[field] = json.loads(value)
            except json.JSONDecodeError:
                pass
    return data


def _course_request_data(request):
    data = {key: request.data.get(key) for key in request.data}
    goal_date = data.get('goal_date')
    if isinstance(goal_date, str) and not goal_date:
        data['goal_date'] = None
    for field in ('sources', 'modules'):
        value = data.get(field)
        if isinstance(value, str):
            try:
                data[field] = json.loads(value)
            except json.JSONDecodeError:
                pass
    return data
