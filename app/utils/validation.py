from functools import wraps
from flask import request, jsonify
from typing import get_type_hints, Type, Any

def validate_schema(schema_class: Type[Any]):
    """
    A runtime validation decorator that enforces strict schema adherence 
    for incoming JSON payloads using Python's typing system.
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            payload = request.json
            if not payload:
                return jsonify({"error": "Missing JSON payload"}), 400

            hints = get_type_hints(schema_class)
            validated_data = {}
            errors = []

            for field, field_type in hints.items():
                if field not in payload:
                    errors.append(f"Missing required field: '{field}'")
                    continue
                
                value = payload[field]
                # Basic type coercion/checking
                try:
                    if field_type == int:
                        validated_data[field] = int(value)
                    elif field_type == str:
                        validated_data[field] = str(value).strip()
                        if not validated_data[field]:
                            errors.append(f"Field '{field}' cannot be empty")
                    elif field_type == bool:
                        validated_data[field] = bool(value)
                    else:
                        validated_data[field] = value
                except (ValueError, TypeError):
                    errors.append(f"Invalid type for '{field}'. Expected {field_type.__name__}")

            if errors:
                return jsonify({"error": "Validation failed", "details": errors}), 422

            # Inject the validated dataclass instance into the route
            kwargs['validated_data'] = schema_class(**validated_data)
            return f(*args, **kwargs)
        return decorated_function
    return decorator
